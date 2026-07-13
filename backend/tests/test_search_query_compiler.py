from dataclasses import replace
from datetime import datetime, timezone
from types import SimpleNamespace

from sqlalchemy.dialects import postgresql

from app.domains.system.search.authorization import SearchAuthorizationPolicy
from app.domains.system.search.compiler import SearchQueryCompiler
from app.domains.system.search.registry import SearchModelRegistration
from app.domains.system.search.validator import SearchPlanValidator
from app.domains.users.models.user_user import UserUser
from tests.test_search_plan_validator import models, plan


class TrackingRelatedPolicy(SearchAuthorizationPolicy):
    def __init__(self):
        self.user_ids = []

    def apply(self, statement, current_user_id):
        self.user_ids.append(current_user_id)
        return statement.where(UserUser.active.is_(True))

    def allows_record(self, record, current_user_id):
        return True


def _compiled(statement):
    return statement.compile(dialect=postgresql.dialect())


def test_related_filter_uses_exists_and_applies_related_authorization_policy():
    validated = SearchPlanValidator.validate_with_models(
        plan(
            filters=[
                {
                    "field": "user_id.name",
                    "operator": "contains",
                    "value": "Antonio%_",
                }
            ]
        ),
        models(),
    ).queries[0]
    policy = TrackingRelatedPolicy()
    resolved = validated.filters[0].resolved_field
    secured_registration = SearchModelRegistration(
        orm_class=UserUser,
        authorization_policy=policy,
        url_builder=lambda record_uuid: str(record_uuid),
    )
    secured_filter = replace(
        validated.filters[0],
        resolved_field=replace(
            resolved,
            related_registration=secured_registration,
        ),
    )
    secured_query = replace(validated, filters=(secured_filter,))

    compiled = _compiled(SearchQueryCompiler.compile(secured_query, 7))
    sql = str(compiled)

    assert policy.user_ids == [7]
    assert "EXISTS" in sql
    assert "user_user.active IS true" in sql
    assert "system_tasks.user_id" in sql
    assert "Antonio" not in sql
    assert "%Antonio\\%\\_%" in compiled.params.values()


def test_root_and_related_values_remain_bound_parameters():
    record_uuid = "12345678-1234-5678-1234-567812345678"
    validated = SearchPlanValidator.validate_with_models(
        plan(
            filters=[
                {"field": "priority", "operator": "eq", "value": "Urgent"},
                {"field": "user_id", "operator": "eq", "value": record_uuid},
            ],
            order=[{"field": "title", "direction": "asc"}],
        ),
        models(),
    ).queries[0]

    compiled = _compiled(SearchQueryCompiler.compile(validated, 7))
    sql = str(compiled)

    assert "Urgent" not in sql
    assert record_uuid not in sql
    assert "EXISTS" in sql
    assert "ORDER BY" in sql
    assert "system_tasks.uuid ASC" in sql
    assert "Urgent" in compiled.params.values()


def test_many_to_many_contains_all_uses_one_authorized_exists_per_value():
    user_one = "12345678-1234-5678-1234-567812345678"
    user_two = "87654321-4321-8765-4321-876543218765"
    metadata = models()
    metadata.append(
        SimpleNamespace(
            name="system.message",
            search=True,
            fields=[
                SimpleNamespace(
                    name="to_users",
                    type="many2many_pills",
                    search_config={
                        "enabled": True,
                        "filter": True,
                        "operators": ["contains_any", "contains_all"],
                    },
                )
            ],
        )
    )
    validated = SearchPlanValidator.validate_with_models(
        plan(
            filters=[
                {
                    "field": "to_users",
                    "operator": "contains_all",
                    "value": [user_one, user_two],
                }
            ],
            model="system.message",
        ),
        metadata,
    ).queries[0]

    compiled = _compiled(SearchQueryCompiler.compile(validated, 7))
    sql = str(compiled)

    # One EXISTS belongs to message visibility; two enforce both recipients.
    assert sql.count("EXISTS") == 3
    assert "system_message_user_rel" in sql
    assert user_one not in sql
    assert user_two not in sql


def test_localized_selection_and_relative_date_compile_to_bound_values():
    validated = SearchPlanValidator.validate_with_models(
        plan(
            filters=[
                {"field": "priority", "operator": "eq", "value": "Urgente"},
                {
                    "field": "date_due",
                    "operator": "this_week",
                    "value": None,
                },
            ]
        ),
        models(),
        language="es",
    ).queries[0]

    compiled = _compiled(
        SearchQueryCompiler.compile(
            validated,
            7,
            language="es",
            timezone_name="America/Mexico_City",
            now=datetime(2026, 7, 15, 18, 0, tzinfo=timezone.utc),
        )
    )
    sql = str(compiled)

    assert "Urgente" not in sql
    assert "Urgent" not in sql
    assert "Urgent" in compiled.params.values()
    assert datetime(2026, 7, 13, 6, 0, tzinfo=timezone.utc) in compiled.params.values()
    assert datetime(2026, 7, 20, 6, 0, tzinfo=timezone.utc) in compiled.params.values()
