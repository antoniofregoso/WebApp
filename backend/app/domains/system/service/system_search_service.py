import asyncio
import re
from dataclasses import dataclass
from typing import Any

from app.domains.system.models.system_model import SystemModelSchemaUse
from app.domains.system.repository.system_model_repository import SystemModelRepository
from app.domains.system.search.registry import require_search_model_registration
from app.domains.system.search.limits import DEFAULT_SEARCH_LIMITS
from app.domains.system.service.system_model_service import SystemModelService
from app.core.config.settings import settings


def _localized(value: Any, lang: str) -> str:
    if isinstance(value, dict):
        preferred = "es_MX" if lang == "es" else "en_US"
        return str(
            value.get(preferred)
            or value.get(lang)
            or value.get("en_US")
            or value.get("en")
            or value.get("es_MX")
            or value.get("es")
            or next(iter(value.values()), "")
        )
    return "" if value is None else str(value)


def _search_text(value: Any, lang: str) -> str:
    if isinstance(value, list):
        return " ".join(_search_text(item, lang) for item in value)
    if isinstance(value, dict) and "uuid" in value:
        return " ".join(str(value.get(key) or "") for key in ("name", "email"))
    return _localized(value, lang)


@dataclass(frozen=True)
class SearchResult:
    model: str
    model_label: str
    uuid: str
    title: str
    subtitle: str | None
    snippet: str | None
    url: str
    score: int


class SearchResults(list[SearchResult]):
    def __init__(
        self, results: list[SearchResult], *, queried_models: list[str]
    ) -> None:
        super().__init__(results)
        self.queried_models = tuple(sorted(set(queried_models)))


class SystemSearchService:
    MAX_LIMIT = DEFAULT_SEARCH_LIMITS.max_results_total

    @staticmethod
    async def search(
        query: str, current_user_id: int, lang: str = "es", limit: int = 20
    ) -> SearchResults:
        async with asyncio.timeout(settings.SEARCH_TIMEOUT_SECONDS):
            return await SystemSearchService._search(
                query, current_user_id, lang, limit
            )

    @staticmethod
    async def _search(
        query: str, current_user_id: int, lang: str = "es", limit: int = 20
    ) -> SearchResults:
        normalized_query = " ".join(str(query or "").split())[
            : DEFAULT_SEARCH_LIMITS.max_string_length
        ]
        terms = [
            term.casefold()
            for term in re.findall(r"[^\W_]+", normalized_query, flags=re.UNICODE)
        ]
        if not terms:
            return SearchResults([], queried_models=[])

        requested_limit = max(1, min(int(limit or 20), SystemSearchService.MAX_LIMIT))
        models = [
            model for model in await SystemModelRepository.get_all() if model.search
        ]
        results: list[SearchResult] = []
        queried_models: list[str] = []
        for model in models:
            registration = require_search_model_registration(model.name)
            searchable = [
                field
                for field in model.fields
                if field.search_config.get("enabled")
                and field.search_config.get("text")
            ]
            if not searchable:
                continue
            queried_models.append(model.name)
            view = await SystemModelService.get_view(
                model.name,
                SystemModelSchemaUse.view,
                "default",
                current_user_id=current_user_id,
            )
            title_field = next(
                (
                    field
                    for field in searchable
                    if field.search_config.get("result") == "title"
                ),
                searchable[0],
            )
            subtitle_fields = [
                field
                for field in searchable
                if field.search_config.get("result") == "subtitle"
            ]
            for record in view["records"]:
                values = {
                    field.name: _search_text(record.get(field.name), lang)
                    for field in searchable
                }
                combined = " ".join(values.values()).casefold()
                if not all(term in combined for term in terms):
                    continue
                title = values.get(title_field.name) or str(record.get("uuid") or "")
                title_folded = title.casefold()
                score = sum(
                    (
                        100
                        if title_folded == term
                        else (
                            70
                            if title_folded.startswith(term)
                            else 50 if term in title_folded else 10
                        )
                    )
                    for term in terms
                )
                subtitle = (
                    " · ".join(
                        filter(
                            None, (values.get(field.name) for field in subtitle_fields)
                        )
                    )
                    or None
                )
                results.append(
                    SearchResult(
                        model=model.name,
                        model_label=_localized(model.label, lang),
                        uuid=str(record.get("uuid") or ""),
                        title=title,
                        subtitle=subtitle,
                        snippet=None,
                        url=registration.build_url(record.get("uuid") or ""),
                        score=score,
                    )
                )

        return SearchResults(
            sorted(
                results,
                key=lambda item: (
                    -item.score,
                    item.model_label.casefold(),
                    item.title.casefold(),
                    item.uuid,
                ),
            )[:requested_limit],
            queried_models=queried_models,
        )
