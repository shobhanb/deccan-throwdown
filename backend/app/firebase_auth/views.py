import logging

from fastapi import APIRouter, status
from firebase_admin import auth as fireauth
from firebase_admin.auth import ListUsersPage, UserRecord
from firebase_admin.exceptions import FirebaseError

from app.settings import admin_user_settings

from .dependencies import admin_user_dependency
from .exceptions import firebase_error, invalid_input_exception
from .schemas import CreateUser, FirebaseCustomClaims, FirebaseUserRecord

log = logging.getLogger("uvicorn.error")

firebase_auth_router = APIRouter(prefix="/fireauth", tags=["fireauth"])


@firebase_auth_router.post("/signup", status_code=status.HTTP_201_CREATED)
async def create_user(
    user_info: CreateUser,
) -> None:
    try:
        user: UserRecord = fireauth.create_user(
            email=user_info.email,
            password=user_info.password,
            display_name=user_info.display_name,
        )
    except ValueError as e:
        msg = "Value error - Invalid user inputs"
        raise invalid_input_exception(msg) from e
    except FirebaseError as e:
        raise firebase_error(e) from e

    user_custom_claims = FirebaseCustomClaims()

    if user.email == admin_user_settings.admin_user_email:
        user_custom_claims.admin = True

        try:
            fireauth.set_custom_user_claims(uid=user.uid, custom_claims=user_custom_claims.model_dump_json())
        except ValueError as e:
            msg = "Invalid UID for custom claims"
            raise invalid_input_exception(msg) from e
        except FirebaseError as e:
            raise firebase_error(e) from e


@firebase_auth_router.post("/change-admin/{uid}", status_code=status.HTTP_202_ACCEPTED)
async def update_user_admin_rights(
    _: admin_user_dependency,
    uid: str,
    admin: bool,  # noqa: FBT001
) -> None:
    claims = FirebaseCustomClaims(admin=admin)
    fireauth.set_custom_user_claims(uid=uid, custom_claims=claims.model_dump_json())


@firebase_auth_router.get("/user/{uid}", status_code=status.HTTP_200_OK, response_model=FirebaseUserRecord)
async def get_user_info(
    _: admin_user_dependency,
    uid: str,
) -> UserRecord:
    return fireauth.get_user(uid)


@firebase_auth_router.delete("/user/{uid}", status_code=status.HTTP_202_ACCEPTED)
async def delete_user(
    _: admin_user_dependency,
    uid: str,
) -> None:
    fireauth.delete_user(uid)


@firebase_auth_router.get("/all", status_code=status.HTTP_200_OK, response_model=list[FirebaseUserRecord])
async def get_all_users(
    _: admin_user_dependency,
) -> list[UserRecord]:
    page: ListUsersPage = fireauth.list_users()
    return list(page.iterate_all())
