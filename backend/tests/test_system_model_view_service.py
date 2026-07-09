from types import SimpleNamespace

import pytest

from app.domains.system.models.system_model import (
    SystemModelSchema,
    SystemModelSchemaUse,
)
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

    async def fake_get_records(model, field_names, relation_names=None):
        assert field_names == ["uuid", "name", "status"]
        assert relation_names == []
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


@pytest.mark.asyncio
async def test_system_model_view_preserves_schema_payload(monkeypatch):
    schema_payload = [
        {"name": "uuid", "type": "string"},
        {"name": "name", "type": "string", "form": {"required": True}},
    ]
    system_model = SimpleNamespace(
        name="user.user",
        label={"en": "Users", "es": "Usuarios"},
        group_by=None,
        group_by_values=[],
        tags=[],
    )
    schema = SimpleNamespace(view={"schema": schema_payload})
    record = SimpleNamespace(uuid="user-uuid", name="App Admin")

    async def fake_get_view_definition(model, use, name):
        return system_model, schema

    async def fake_get_records(model, field_names, relation_names=None):
        assert field_names == ["uuid", "name"]
        assert relation_names == []
        return [record]

    monkeypatch.setattr(
        SystemModelRepository,
        "get_view_definition",
        fake_get_view_definition,
    )
    monkeypatch.setattr(SystemModelRepository, "get_records", fake_get_records)

    result = await SystemModelService.get_view(
        "user.user",
        SystemModelSchemaUse.view,
        "default",
    )

    assert result["model"]["schema"] == schema_payload
    assert result["records"] == [{"uuid": "user-uuid", "name": "App Admin"}]


@pytest.mark.asyncio
async def test_system_model_view_ignores_pydantic_schema_method(monkeypatch):
    schema_payload = [
        {"name": "uuid", "type": "string"},
        {"name": "name", "type": "string"},
    ]
    system_model = SimpleNamespace(
        name="system.model",
        label={"en": "Models", "es": "Modelos"},
        group_by=None,
        group_by_values=[],
        tags=[],
    )
    schema = SystemModelSchema(
        name="default",
        use=SystemModelSchemaUse.view,
        view=schema_payload,
        model_id=1,
    )
    record = SimpleNamespace(uuid="model-uuid", name="system.model")

    async def fake_get_view_definition(model, use, name):
        return system_model, schema

    async def fake_get_records(model, field_names, relation_names=None):
        assert field_names == ["uuid", "name"]
        assert relation_names == []
        return [record]

    monkeypatch.setattr(
        SystemModelRepository,
        "get_view_definition",
        fake_get_view_definition,
    )
    monkeypatch.setattr(SystemModelRepository, "get_records", fake_get_records)

    result = await SystemModelService.get_view(
        "system.model",
        SystemModelSchemaUse.view,
        "default",
    )

    assert result["model"]["schema"] == schema_payload
    assert result["records"] == [{"uuid": "model-uuid", "name": "system.model"}]


@pytest.mark.asyncio
async def test_system_model_view_serializes_related_schemas_as_schema(monkeypatch):
    related_schema = SystemModelSchema(
        id=1,
        name="default",
        use=SystemModelSchemaUse.view,
        view=[{"name": "uuid", "type": "string"}],
        model_id=1,
    )
    system_model = SimpleNamespace(
        name="system.model",
        label={"en": "Models", "es": "Modelos"},
        group_by=None,
        group_by_values=[],
        tags=[],
    )
    schema = SimpleNamespace(
        view=[
            {"name": "uuid", "type": "string"},
            {"name": "schemas", "type": "one2many_list"},
        ]
    )
    record = SimpleNamespace(uuid="model-uuid", schemas=[related_schema])

    async def fake_get_view_definition(model, use, name):
        return system_model, schema

    async def fake_get_records(model, field_names, relation_names=None):
        assert field_names == ["uuid", "schemas"]
        assert relation_names == []
        return [record]

    monkeypatch.setattr(
        SystemModelRepository,
        "get_view_definition",
        fake_get_view_definition,
    )
    monkeypatch.setattr(SystemModelRepository, "get_records", fake_get_records)

    result = await SystemModelService.get_view(
        "system.model",
        SystemModelSchemaUse.view,
        "default",
    )

    related_payload = result["records"][0]["schemas"][0]
    assert "schema" in related_payload
    assert "view" not in related_payload
    assert related_payload["schema"] == [{"name": "uuid", "type": "string"}]


@pytest.mark.asyncio
async def test_system_model_view_serializes_many2one_with_translated_name(monkeypatch):
    company = SimpleNamespace(
        uuid="company-uuid",
        name={"en": "My Company", "es": "Mi Empresa"},
        avatar_url=None,
    )
    system_model = SimpleNamespace(
        name="user.user",
        label={"en": "Users", "es": "Usuarios"},
        group_by=None,
        group_by_values=[],
        tags=[],
    )
    schema = SimpleNamespace(
        view=[
            {"name": "uuid", "type": "string"},
            {"name": "company_id", "type": "many2one"},
        ]
    )
    record = SimpleNamespace(uuid="user-uuid", company=company)

    async def fake_get_view_definition(model, use, name):
        return system_model, schema

    async def fake_get_records(model, field_names, relation_names=None):
        assert field_names == ["uuid", "company_id"]
        assert relation_names == ["company"]
        return [record]

    monkeypatch.setattr(
        SystemModelRepository,
        "get_view_definition",
        fake_get_view_definition,
    )
    monkeypatch.setattr(SystemModelRepository, "get_records", fake_get_records)

    result = await SystemModelService.get_view(
        "user.user",
        SystemModelSchemaUse.view,
        "default",
    )

    assert result["records"] == [
        {
            "uuid": "user-uuid",
            "company_id": {
                "uuid": "company-uuid",
                "name": "Mi Empresa",
                "model": None,
            },
        }
    ]
