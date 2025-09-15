from __future__ import annotations

from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import ForeignKey, Integer, String, UniqueConstraint, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

if TYPE_CHECKING:
    from app.teams.models import Team


class Score(Base):
    __table_args__ = (UniqueConstraint("team_id", "wod_number"),)

    reps: Mapped[int | None] = mapped_column(Integer, nullable=True)
    time_s: Mapped[int | None] = mapped_column(Integer, nullable=True)
    tiebreak_s: Mapped[int | None] = mapped_column(Integer, nullable=True)
    score_detail: Mapped[str | None] = mapped_column(String, nullable=True)
    verified: Mapped[bool] = mapped_column(String, default=False)
    wod_rank: Mapped[int | None] = mapped_column(Integer, nullable=True)

    team_id: Mapped[UUID] = mapped_column(Uuid, ForeignKey("team.id"))
    team: Mapped[Team] = relationship(back_populates="scores")

    wod_number: Mapped[int] = mapped_column(Integer)
