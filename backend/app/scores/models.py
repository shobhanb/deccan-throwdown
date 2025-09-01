from __future__ import annotations

from typing import TYPE_CHECKING, Any
from uuid import UUID

from sqlalchemy import JSON, ForeignKey, Integer, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

if TYPE_CHECKING:
    from app.teams.models import Teams
    from app.wods.models import Wods


class Scores(Base):
    reps: Mapped[int | None] = mapped_column(Integer, nullable=True)
    time_s: Mapped[int | None] = mapped_column(Integer, nullable=True)
    tiebreak_s: Mapped[int | None] = mapped_column(Integer, nullable=True)
    score_detail: Mapped[dict[str, Any]] = mapped_column(JSON)

    team_id: Mapped[UUID] = mapped_column(Uuid, ForeignKey("teams.id"))
    team: Mapped[Teams] = relationship(back_populates="scores")

    wod_id: Mapped[UUID] = mapped_column(Uuid, ForeignKey("wods.id"))
    wod: Mapped[Wods] = relationship(back_populates="scores")
