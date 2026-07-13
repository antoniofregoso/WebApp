from types import SimpleNamespace

import pytest

from app.domains.system.repository.system_model_repository import SystemModelRepository
from app.domains.system.service.system_model_service import SystemModelService
from app.domains.system.service.system_search_service import SystemSearchService


def field(name, result, weight="B"):
    return SimpleNamespace(
        name=name,
        search_config={"enabled": True, "text": True, "result": result, "weight": weight},
    )


@pytest.mark.asyncio
async def test_search_only_uses_enabled_models_and_user_scoped_views(monkeypatch):
    models = [
        SimpleNamespace(
            name="system.task", search=True, label={"es_MX": "Tareas"},
            fields=[field("title", "title", "A"), field("priority", "subtitle")],
        ),
        SimpleNamespace(
            name="system.company", search=False, label={"es_MX": "Empresas"},
            fields=[field("name", "title")],
        ),
    ]

    async def get_all():
        return models

    async def get_view(model, use, name, current_user_id=None):
        assert model == "system.task"
        assert current_user_id == 7
        return {"records": [
            {"uuid": "task-1", "title": {"es_MX": "Preparar reporte urgente"}, "priority": "Urgent"},
            {"uuid": "task-2", "title": {"es_MX": "Comprar café"}, "priority": "Low"},
        ]}

    monkeypatch.setattr(SystemModelRepository, "get_all", get_all)
    monkeypatch.setattr(SystemModelService, "get_view", get_view)

    results = await SystemSearchService.search("reporte urgente", 7, lang="es")

    assert [result.uuid for result in results] == ["task-1"]
    assert results[0].title == "Preparar reporte urgente"
    assert results[0].subtitle == "Urgent"
    assert results[0].url == "/dashboard/user/system.task/task-1"


@pytest.mark.asyncio
async def test_search_rejects_empty_queries(monkeypatch):
    async def fail_if_called():
        raise AssertionError("models must not be loaded")

    monkeypatch.setattr(SystemModelRepository, "get_all", fail_if_called)
    assert await SystemSearchService.search("   ", 7) == []
