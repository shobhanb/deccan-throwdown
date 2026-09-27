from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class FcmToken(Base):
    token: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    firebase_uid: Mapped[str | None] = mapped_column(String, nullable=True)
    event_short_name: Mapped[str] = mapped_column(String, nullable=False)
    platform: Mapped[str | None] = mapped_column(String, nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String, nullable=True)
    subscribe_event: Mapped[bool] = mapped_column(default=True)
    subscribe_admin: Mapped[bool] = mapped_column(default=False)
    last_seen_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)


class WodLeaderboardNotification(Base):
    __table_args__ = (UniqueConstraint("event_short_name", "wod_number"),)

    event_short_name: Mapped[str] = mapped_column(String, nullable=False)
    wod_number: Mapped[int] = mapped_column(nullable=False)
    notified_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
