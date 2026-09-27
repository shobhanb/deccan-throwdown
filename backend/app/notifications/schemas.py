from pydantic import BaseModel, Field


class FcmTokenRegisterModel(BaseModel):
    token: str = Field(min_length=1)
    event_short_name: str = Field(min_length=1)
    subscribe_event: bool = True
    platform: str | None = None
    user_agent: str | None = None


class FcmTokenRegisterResponseModel(BaseModel):
    registered: bool = True
