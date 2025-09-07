from __future__ import annotations

import datetime as dt
from typing import TYPE_CHECKING

from sqlalchemy import Date, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

if TYPE_CHECKING:
    from app.teams.models import Team
    from app.wods.models import Wod


class Event(Base):
    year: Mapped[int] = mapped_column(Integer)
    event_name: Mapped[str] = mapped_column(String)
    event_short_name: Mapped[str] = mapped_column(String, primary_key=True)
    athletes_per_team: Mapped[int] = mapped_column(Integer)
    organization_name: Mapped[str] = mapped_column(String)
    city: Mapped[str] = mapped_column(String)
    country: Mapped[str] = mapped_column(String)
    start_date: Mapped[dt.date] = mapped_column(Date)
    end_date: Mapped[dt.date] = mapped_column(Date)

    teams: Mapped[list[Team]] = relationship(back_populates="event")
    wods: Mapped[list[Wod]] = relationship(back_populates="event")
