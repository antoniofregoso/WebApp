import strawberry
import uuid as uuid_lib


@strawberry.type
class UserType:
    id: int
    uuid: uuid_lib.UUID
    name: str
    email: str
    disabled: bool


@strawberry.input
class RegisterInput:
    name: str
    email: str
    password: str


@strawberry.input
class LoginInput:
    email: str
    password: str


@strawberry.type
class LoginType:
    email: str
    token: str
