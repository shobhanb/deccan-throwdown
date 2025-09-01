from __future__ import annotations

import datetime as dt
from typing import TYPE_CHECKING

from sqlalchemy import Date, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

if TYPE_CHECKING:
    from app.teams.models import Teams
    from app.wods.models import Wods


class Events(Base):
    __table_args__ = (UniqueConstraint("year", "event_name"),)

    year: Mapped[int] = mapped_column(Integer)
    event_name: Mapped[str] = mapped_column(String)
    organization_name: Mapped[str] = mapped_column(String)
    city: Mapped[str] = mapped_column(String)
    country: Mapped[str] = mapped_column(String)
    start_date: Mapped[dt.date] = mapped_column(Date)
    end_date: Mapped[dt.date] = mapped_column(Date)

    teams: Mapped[list[Teams]] = relationship(back_populates="event")
    wods: Mapped[list[Wods]] = relationship(back_populates="event")
