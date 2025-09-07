from __future__ import annotations

from typing import TYPE_CHECKING, Any

from sqlalchemy import JSON, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

if TYPE_CHECKING:
    from app.events.models import Event
    from app.scores.models import Score


class Wod(Base):
    __table_args__ = (UniqueConstraint("wod_number", "event_short_name"),)

    wod_number: Mapped[int] = mapped_column(Integer)
    wod_name: Mapped[str] = mapped_column(String)
    wod_score_type: Mapped[str] = mapped_column(String)
    wod_description: Mapped[dict[str, Any]] = mapped_column(JSON)

    event_short_name: Mapped[str] = mapped_column(String, ForeignKey("event.event_short_name"))
    event: Mapped[Event] = relationship(back_populates="wods")

    scores: Mapped[list[Score]] = relationship(back_populates="wod")
