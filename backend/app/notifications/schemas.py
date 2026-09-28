from pydantic import BaseModel, Field


class FcmTokenRegisterModel(BaseModel):
    token: str = Field(min_length=1)
    event_short_name: str = Field(min_length=1)
    subscribe_event: bool = True
    platform: str | None = None
    user_agent: str | None = None


class FcmTokenRegisterResponseModel(BaseModel):
    registered: bool = True


class CustomNotificationSendModel(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    body: str = Field(min_length=1, max_length=500)
    event_short_name: str = Field(min_length=1)
    route: str = Field(default="/home", pattern=r"^/")


class CustomNotificationSendResponseModel(BaseModel):
    sent: bool = True
