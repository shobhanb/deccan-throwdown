from collections.abc import Sequence

from fastapi import APIRouter, status
from sqlalchemy import select

from app.database.dependencies import db_dependency

from .core import auth_backend, fastapi_users
from .dependencies import current_superuser_dependency
from .models import User
from .schemas import UserCreate, UserRead, UserUpdate

auth_router = APIRouter(prefix="/auth", tags=["auth"])


@auth_router.get("/users", status_code=status.HTTP_200_OK, response_model=list[UserRead])
async def get_users(
    db_session: db_dependency,
    _: current_superuser_dependency,
) -> Sequence[User]:
    stmt = select(User)
    result = await db_session.execute(stmt)
    return result.scalars().all()


auth_router.include_router(fastapi_users.get_auth_router(auth_backend, requires_verification=True))
auth_router.include_router(fastapi_users.get_register_router(UserRead, UserCreate))
auth_router.include_router(fastapi_users.get_verify_router(UserRead))
auth_router.include_router(fastapi_users.get_reset_password_router())
auth_router.include_router(fastapi_users.get_users_router(UserRead, UserUpdate, requires_verification=True))
