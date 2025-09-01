from __future__ import annotations

from typing import TYPE_CHECKING, Any
from uuid import UUID

from sqlalchemy import JSON, ForeignKey, Integer, String, UniqueConstraint, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

if TYPE_CHECKING:
    from app.events.models import Events
    from app.scores.models import Scores


class Wods(Base):
    __table_args__ = (UniqueConstraint("wod_number", "event_id"),)

    wod_number: Mapped[int] = mapped_column(Integer)
    wod_name: Mapped[str] = mapped_column(String)
    wod_score_type: Mapped[str] = mapped_column(String)
    wod_description: Mapped[dict[str, Any]] = mapped_column(JSON)

    event_id: Mapped[UUID] = mapped_column(Uuid, ForeignKey("events.id"))
    event: Mapped[Events] = relationship(back_populates="wods")

    scores: Mapped[list[Scores]] = relationship(back_populates="wod")
