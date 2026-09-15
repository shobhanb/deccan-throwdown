from __future__ import annotations

from typing import TYPE_CHECKING
from uuid import UUID

from datetime import date

from sqlalchemy import Boolean, Date, ForeignKey, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

if TYPE_CHECKING:
    from app.teams.models import Team


class Athlete(Base):
    first_name: Mapped[str] = mapped_column(String)
    last_name: Mapped[str] = mapped_column(String)
    sex: Mapped[str] = mapped_column(String)
    email: Mapped[str | None] = mapped_column(String, nullable=True)
    phone_number: Mapped[str | None] = mapped_column(String, nullable=True)
    date_of_birth: Mapped[date | None] = mapped_column(Date, nullable=True)

    waiver: Mapped[bool] = mapped_column(Boolean, default=False)
    gym: Mapped[str | None] = mapped_column(String, nullable=True)
    city: Mapped[str | None] = mapped_column(String, nullable=True)

    team_id: Mapped[UUID] = mapped_column(Uuid, ForeignKey("team.id"))
    team: Mapped[Team] = relationship(back_populates="athletes")
