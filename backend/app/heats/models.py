from __future__ import annotations

from typing import Any

from sqlalchemy import JSON, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class HeatsDocument(Base):
    event_short_name: Mapped[str] = mapped_column(
        String, unique=True, nullable=False, index=True
    )
    """Schedule JSON (days / blocks / heats) — no display flags."""
    payload: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    """Display board flags — separate from schedule JSON."""
    display: Mapped[dict[str, Any]] = mapped_column(
        JSON, nullable=False, default=dict
    )
