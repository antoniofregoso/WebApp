from sqlalchemy import inspect

from app.domains.system.models import (
    SystemCompany,
    SystemWhatsApp,
    SystemWhatsAppMessage,
)


def _foreign_key_targets(table):
    return {
        foreign_key.target_fullname
        for column in table.columns
        for foreign_key in column.foreign_keys
    }


def test_system_whatsapp_configuration_schema():
    table = SystemWhatsApp.__table__

    assert table.name == "system_whatsapp"
    assert {
        "company_id",
        "phone_number",
        "phone_number_id",
        "business_account_id",
        "access_token",
        "verify_token",
        "app_secret",
    }.issubset(table.columns.keys())
    assert "system_companies.id" in _foreign_key_targets(table)
    assert "uq_system_whatsapp_company_phone_number_id" in {
        constraint.name for constraint in table.constraints
    }


def test_system_whatsapp_message_schema_and_indexes():
    table = SystemWhatsAppMessage.__table__

    assert table.name == "system_whatsapp_messages"
    assert {
        "whatsapp_id",
        "external_message_id",
        "model_id",
        "record_uuid",
        "direction",
        "status",
        "payload",
    }.issubset(table.columns.keys())
    assert {
        "system_whatsapp.id",
        "system_models.id",
    }.issubset(_foreign_key_targets(table))
    assert "ix_system_whatsapp_messages_record" in {
        index.name for index in table.indexes
    }


def test_whatsapp_relationships_are_bidirectional():
    company_relationship = inspect(SystemCompany).relationships[
        "whatsapp_configurations"
    ]
    configuration_relationship = inspect(SystemWhatsApp).relationships["company"]
    messages_relationship = inspect(SystemWhatsApp).relationships["messages"]
    message_relationship = inspect(SystemWhatsAppMessage).relationships["whatsapp"]

    assert company_relationship.mapper.class_ is SystemWhatsApp
    assert company_relationship.back_populates == "company"
    assert configuration_relationship.back_populates == "whatsapp_configurations"
    assert messages_relationship.mapper.class_ is SystemWhatsAppMessage
    assert messages_relationship.back_populates == "whatsapp"
    assert message_relationship.back_populates == "messages"
