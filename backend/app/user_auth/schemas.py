from uuid import UUID

from fastapi_users import schemas


class UserNameMixin:
    name: str


class UserNameMixinOptional:
    name: str | None = None


class UserRead(UserNameMixin, schemas.BaseUser[UUID]):
    pass


class UserCreate(UserNameMixin, schemas.BaseUserCreate):
    pass


class UserUpdate(UserNameMixinOptional, schemas.BaseUserUpdate):
    pass
