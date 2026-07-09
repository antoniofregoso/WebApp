import strawberry
from sqlalchemy.orm import configure_mappers
from sqlmodel import SQLModel

from main import Mutation, Query


def test_system_task_is_registered_in_orm_and_graphql():
    configure_mappers()
    schema = strawberry.Schema(query=Query, mutation=Mutation).as_str()

    assert "system_tasks" in SQLModel.metadata.tables
    assert "systemTasks" in schema
    assert "systemTask(" in schema
    assert "createSystemTask" in schema
    assert "updateSystemTask" in schema
    assert "deleteSystemTask" in schema


def test_color_is_exposed_as_a_graphql_selection():
    schema = strawberry.Schema(query=Query, mutation=Mutation).as_str()

    assert "enum SystemColor" in schema
    assert "color: SystemColor!" in schema
    assert "color: SystemColor! = zinc" in schema


def test_system_model_view_query_is_exposed():
    schema = strawberry.Schema(query=Query, mutation=Mutation).as_str()

    assert "systemModelView(" in schema
    assert "model: String!" in schema
    assert "use: SystemModelSchemaUse!" in schema
    assert "name: String!" in schema
    assert "type SystemModelViewType" in schema


def test_refresh_session_mutation_is_exposed():
    schema = strawberry.Schema(query=Query, mutation=Mutation).as_str()

    assert "refreshSession(" in schema
    assert "refresh: RefreshSessionInput!" in schema
    assert "input RefreshSessionInput" in schema
    assert "refreshToken: String!" in schema
    assert "accessToken: String!" in schema
    assert "refreshToken: String!" in schema


def test_logout_mutation_is_exposed():
    schema = strawberry.Schema(query=Query, mutation=Mutation).as_str()

    assert "logout(" in schema
    assert "logout: LogoutInput!" in schema
    assert "input LogoutInput" in schema
    assert "refreshToken: String!" in schema
