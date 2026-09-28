from datetime import UTC, datetime

from fastapi import APIRouter, status

from app.database.dependencies import db_dependency
from app.firebase_auth.dependencies import admin_user_dependency

from .dependencies import optional_firebase_user_dependency
from .models import FcmToken
from .schemas import (
    CustomNotificationSendModel,
    CustomNotificationSendResponseModel,
    FcmTokenRegisterModel,
    FcmTokenRegisterResponseModel,
)
from .service import NotificationService
from .topics import admin_topic, event_topic

notifications_router = APIRouter(prefix="/notifications", tags=["notifications"])


@notifications_router.post(
    "/tokens",
    status_code=status.HTTP_201_CREATED,
    response_model=FcmTokenRegisterResponseModel,
)
async def register_fcm_token(
    db_session: db_dependency,
    body: FcmTokenRegisterModel,
    firebase_user: optional_firebase_user_dependency,
) -> FcmTokenRegisterResponseModel:
    firebase_uid = firebase_user.get("uid") if firebase_user else None
    is_admin = bool(
        firebase_user
        and firebase_user.get("admin")
        and firebase_user.get("email_verified"),
    )

    existing = await FcmToken.find(async_session=db_session, token=body.token)
    if existing:
        existing.event_short_name = body.event_short_name
        existing.firebase_uid = firebase_uid
        existing.platform = body.platform
        existing.user_agent = body.user_agent
        existing.subscribe_event = body.subscribe_event
        existing.subscribe_admin = is_admin
        existing.last_seen_at = datetime.now(UTC)
        db_session.add(existing)
    else:
        record = FcmToken(
            token=body.token,
            firebase_uid=firebase_uid,
            event_short_name=body.event_short_name,
            platform=body.platform,
            user_agent=body.user_agent,
            subscribe_event=body.subscribe_event,
            subscribe_admin=is_admin,
            last_seen_at=datetime.now(UTC),
        )
        db_session.add(record)

    await db_session.commit()

    if body.subscribe_event:
        NotificationService.subscribe_token(body.token, event_topic(body.event_short_name))
    else:
        NotificationService.unsubscribe_token(body.token, event_topic(body.event_short_name))

    if is_admin:
        NotificationService.subscribe_token(body.token, admin_topic())
    else:
        NotificationService.unsubscribe_token(body.token, admin_topic())

    return FcmTokenRegisterResponseModel()


@notifications_router.delete(
    "/tokens/{token}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def unregister_fcm_token(
    db_session: db_dependency,
    token: str,
) -> None:
    record = await FcmToken.find(async_session=db_session, token=token)
    if not record:
        return

    NotificationService.unsubscribe_token(record.token, event_topic(record.event_short_name))
    if record.subscribe_admin:
        NotificationService.unsubscribe_token(record.token, admin_topic())

    await record.delete(async_session=db_session)


@notifications_router.post(
    "/custom",
    status_code=status.HTTP_200_OK,
    response_model=CustomNotificationSendResponseModel,
)
async def send_custom_notification(
    _: admin_user_dependency,
    body: CustomNotificationSendModel,
) -> CustomNotificationSendResponseModel:
    NotificationService.send_custom_event_notification(
        body.event_short_name,
        body.title,
        body.body,
        body.route,
    )
    return CustomNotificationSendResponseModel()
