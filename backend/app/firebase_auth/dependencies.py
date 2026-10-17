from typing import Annotated

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from firebase_admin.auth import verify_id_token
from firebase_admin.exceptions import FirebaseError

from app.apikey_auth.core import optional_api_key_scheme
from app.exceptions import unauthorised_exception
from app.settings import auth_settings

firebase_bearer_scheme = HTTPBearer()
optional_firebase_bearer_scheme = HTTPBearer(auto_error=False)


async def get_firebase_user_from_token(
    token: Annotated[HTTPAuthorizationCredentials, Depends(firebase_bearer_scheme)],
) -> dict:
    return verify_id_token(token.credentials)


async def get_verified_user(
    user_record: Annotated[dict, Depends(get_firebase_user_from_token)],
) -> dict:
    if user_record.get("email_verified"):
        return user_record
    raise unauthorised_exception()


async def get_admin_user(
    user_record: Annotated[dict, Depends(get_firebase_user_from_token)],
) -> dict:
    if user_record.get("admin") and user_record.get("email_verified"):
        return user_record
    raise unauthorised_exception()


async def get_optional_admin_user(
    token: Annotated[
        HTTPAuthorizationCredentials | None,
        Depends(optional_firebase_bearer_scheme),
    ],
) -> dict | None:
    if token is None:
        return None
    try:
        user_record = verify_id_token(token.credentials)
    except (ValueError, FirebaseError):
        return None
    if user_record.get("admin") and user_record.get("email_verified"):
        return user_record
    return None


async def get_admin_user_or_api_key(
    token: Annotated[
        HTTPAuthorizationCredentials | None,
        Depends(optional_firebase_bearer_scheme),
    ],
    api_key: Annotated[str | None, Depends(optional_api_key_scheme)],
) -> None:
    if api_key is not None and api_key == auth_settings.admin_api_key:
        return
    if token is not None:
        try:
            user_record = verify_id_token(token.credentials)
        except (ValueError, FirebaseError):
            raise unauthorised_exception() from None
        if user_record.get("admin") and user_record.get("email_verified"):
            return
    raise unauthorised_exception()


#
# Dependencies
#

verified_user_dependency = Annotated[dict, Depends(get_verified_user)]
admin_user_dependency = Annotated[dict, Depends(get_admin_user)]
optional_admin_user_dependency = Annotated[dict | None, Depends(get_optional_admin_user)]
admin_user_or_api_key_dependency = Annotated[None, Depends(get_admin_user_or_api_key)]
