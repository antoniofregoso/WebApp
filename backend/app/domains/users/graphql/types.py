import strawberry
import uuid as uuid_lib
from typing import Optional


@strawberry.type
class UserType:
    id: int
    uuid: uuid_lib.UUID
    name: str
    email: str
    avatar_url: Optional[str]
    theme: str
    lang: Optional[str]
    active: bool


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
