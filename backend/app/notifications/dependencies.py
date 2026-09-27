from typing import Annotated

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from firebase_admin.auth import verify_id_token

optional_firebase_bearer = HTTPBearer(auto_error=False)


async def optional_firebase_user(
    token: Annotated[HTTPAuthorizationCredentials | None, Depends(optional_firebase_bearer)],
) -> dict | None:
    if token is None:
        return None
    return verify_id_token(token.credentials)


optional_firebase_user_dependency = Annotated[dict | None, Depends(optional_firebase_user)]
