from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base
from app.scores.models import Score

if TYPE_CHECKING:
    from app.athletes.models import Athlete


class Team(Base):
    __table_args__ = (UniqueConstraint("team_name", "event_short_name"),)

    category: Mapped[str] = mapped_column(String)
    team_name: Mapped[str] = mapped_column(String)
    event_short_name: Mapped[str] = mapped_column(String)
    overall_rank: Mapped[int | None] = mapped_column(Integer, nullable=True)
    overall_points: Mapped[int | None] = mapped_column(Integer, nullable=True)

    paid: Mapped[bool] = mapped_column(Boolean, default=False)
    verified: Mapped[bool] = mapped_column(Boolean, default=False)

    athletes: Mapped[list[Athlete]] = relationship(back_populates="team", cascade="all, delete-orphan")
    scores: Mapped[list[Score]] = relationship(back_populates="team")
