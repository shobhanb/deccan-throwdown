from typing import Annotated

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from firebase_admin.auth import verify_id_token

from app.exceptions import unauthorised_exception

firebase_bearer_scheme = HTTPBearer()


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


#
# Dependencies
#

verified_user_dependency = Annotated[dict, Depends(get_verified_user)]
admin_user_dependency = Annotated[dict, Depends(get_admin_user)]
