from types import SimpleNamespace

import pytest

from app.domains.system.models.system_model import SystemModelSchemaUse
from app.domains.system.repository.system_model_repository import SystemModelRepository
from app.domains.system.service.system_model_service import SystemModelService


@pytest.mark.asyncio
async def test_system_model_view_places_group_values_under_group_by(monkeypatch):
    system_model = SimpleNamespace(
        name="sale.order",
        label={"en": "Sale Order", "es": "Orden de Venta"},
        group_by="status",
        group_by_values=[
            {"value": "draft", "color": "zinc", "en": "Draft", "es": "Borrador"}
        ],
        tags=[],
    )
    schema = SimpleNamespace(
        view=[
            {"name": "uuid", "type": "string"},
            {"name": "name", "type": "string"},
        ]
    )
    record = SimpleNamespace(uuid="record-uuid", name="SO001", status="draft")

    async def fake_get_view_definition(model, use, name):
        return system_model, schema

    async def fake_get_records(model, field_names):
        assert field_names == ["uuid", "name", "status"]
        return [record]

    monkeypatch.setattr(
        SystemModelRepository,
        "get_view_definition",
        fake_get_view_definition,
    )
    monkeypatch.setattr(SystemModelRepository, "get_records", fake_get_records)

    result = await SystemModelService.get_view(
        "sale.order",
        SystemModelSchemaUse.view,
        "default",
    )

    assert list(result["model"]) == [
        "name",
        "label",
        "groupBy",
        "status",
        "tags",
        "schema",
    ]
    assert result["model"]["groupBy"] == "status"
    assert result["model"]["status"] == system_model.group_by_values
    assert result["records"] == [
        {"uuid": "record-uuid", "name": "SO001", "status": "draft"}
    ]
