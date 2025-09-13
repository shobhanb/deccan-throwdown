from __future__ import annotations

from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import ForeignKey, Integer, String, UniqueConstraint, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

if TYPE_CHECKING:
    from app.teams.models import Team
    from app.wods.models import Wod


class Score(Base):
    __table_args__ = (UniqueConstraint("team_id", "wod_id"),)

    reps: Mapped[int] = mapped_column(Integer, default=0)
    time_s: Mapped[int | None] = mapped_column(Integer, nullable=True)
    tiebreak_s: Mapped[int | None] = mapped_column(Integer, nullable=True)
    score_detail: Mapped[str | None] = mapped_column(String, nullable=True)

    team_id: Mapped[UUID] = mapped_column(Uuid, ForeignKey("team.id"))
    team: Mapped[Team] = relationship(back_populates="scores")

    wod_id: Mapped[UUID] = mapped_column(Uuid, ForeignKey("wod.id"))
    wod: Mapped[Wod] = relationship(back_populates="scores")
