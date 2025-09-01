from __future__ import annotations

from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import Boolean, ForeignKey, String, UniqueConstraint, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base
from app.scores.models import Scores

if TYPE_CHECKING:
    from app.athletes.models import Athletes
    from app.events.models import Events


class Teams(Base):
    __table_args__ = (UniqueConstraint("team_name", "event_id"),)

    category: Mapped[str] = mapped_column(String)
    team_name: Mapped[str] = mapped_column(String)
    paid: Mapped[bool] = mapped_column(Boolean, default=False)
    verified: Mapped[bool] = mapped_column(Boolean, default=False)

    event_id: Mapped[UUID] = mapped_column(Uuid, ForeignKey("events.id"))
    event: Mapped[Events] = relationship(back_populates="teams")

    athletes: Mapped[list[Athletes]] = relationship(back_populates="team")
    scores: Mapped[list[Scores]] = relationship(back_populates="team")
