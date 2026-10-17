from typing import Annotated

from fastapi import Depends

from app.exceptions import unauthorised_exception
from app.settings import auth_settings

from .core import api_key_scheme

#
# API Key Auth
#


async def verify_admin_api_key(key: str = Depends(api_key_scheme)) -> None:
    if key != auth_settings.admin_api_key:
        raise unauthorised_exception(detail="Invalid API key")


#
# Dependencies
#
api_key_admin_dependency = Annotated[None, Depends(verify_admin_api_key)]
