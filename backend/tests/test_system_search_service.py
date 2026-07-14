from types import SimpleNamespace

import pytest
from sqlalchemy.dialects import postgresql

from app.domains.system.repository.system_model_repository import SystemModelRepository
from app.domains.system.search.repository import SearchQueryRepository
from app.domains.system.service.system_search_service import SystemSearchService


def field(name, result, weight="B"):
    return SimpleNamespace(
        name=name,
        search_config={
            "enabled": True,
            "text": True,
            "result": result,
            "weight": weight,
        },
    )


@pytest.mark.asyncio
async def test_search_only_uses_enabled_models_and_user_scoped_views(monkeypatch):
    models = [
        SimpleNamespace(
            name="system.task",
            search=True,
            label={"es_MX": "Tareas"},
            fields=[field("title", "title", "A"), field("priority", "subtitle")],
        ),
        SimpleNamespace(
            name="system.company",
            search=False,
            label={"es_MX": "Empresas"},
            fields=[field("name", "title")],
        ),
    ]

    async def get_all():
        return models

    captured_statements = []

    async def execute(statement):
        captured_statements.append(statement)
        return [
            SimpleNamespace(
                uuid="task-1",
                title={"es_MX": "Preparar reporte urgente"},
                priority="Urgent",
            )
        ]

    monkeypatch.setattr(SystemModelRepository, "get_all_with_fields", get_all)
    monkeypatch.setattr(SearchQueryRepository, "execute", execute)

    results = await SystemSearchService.search("reporte urgente", 7, lang="es")

    assert [result.uuid for result in results] == ["task-1"]
    assert results[0].title == "Preparar reporte urgente"
    assert results[0].subtitle == "Urgent"
    assert results[0].url == "/dashboard/user/system.task/task-1"

    # Only the enabled model (system.task) is queried, and its authorization
    # policy (scoping to the requesting user) is baked into the compiled SQL.
    assert len(captured_statements) == 1
    compiled = str(
        captured_statements[0].compile(
            dialect=postgresql.dialect(), compile_kwargs={"literal_binds": True}
        )
    )
    assert "system_tasks" in compiled
    assert "user_id" in compiled
    assert "= 7" in compiled


@pytest.mark.asyncio
async def test_search_rejects_empty_queries(monkeypatch):
    async def fail_if_called():
        raise AssertionError("models must not be loaded")

    monkeypatch.setattr(SystemModelRepository, "get_all_with_fields", fail_if_called)
    assert await SystemSearchService.search("   ", 7) == []


@pytest.mark.asyncio
async def test_search_fails_closed_for_enabled_unregistered_models(monkeypatch):
    async def get_all():
        return [
            SimpleNamespace(
                name="system.company",
                search=True,
                label={"en_US": "Companies"},
                fields=[field("name", "title")],
            )
        ]

    monkeypatch.setattr(SystemModelRepository, "get_all_with_fields", get_all)

    with pytest.raises(ValueError, match="is not registered"):
        await SystemSearchService.search("Acme", 7)
