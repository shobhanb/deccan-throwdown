from __future__ import annotations

from sqlalchemy import Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class EvenScoringTable(Base):
    __table_args__ = (UniqueConstraint("num_athletes", "rank"),)

    num_athletes: Mapped[str] = mapped_column(String)
    min_athletes: Mapped[int] = mapped_column(Integer)
    max_athletes: Mapped[int] = mapped_column(Integer)
    rank: Mapped[int] = mapped_column(Integer)
    points: Mapped[int] = mapped_column(Integer)
    points_diff: Mapped[int | None] = mapped_column(Integer, nullable=True)
