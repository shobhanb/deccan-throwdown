from __future__ import annotations

from typing import Any

from pydantic import Field

from app.schemas import CustomBaseModel


class HeatsDisplayConfigModel(CustomBaseModel):
    pics: bool = True

    wod_desc_1: bool = True
    wod_desc_2: bool = True
    wod_desc_3: bool = True
    wod_desc_4: bool = True
    wod_desc_5: bool = True

    heats_wod_1: bool = False
    heats_wod_2: bool = False
    heats_wod_3: bool = False
    heats_wod_4_ttmm: bool = False
    heats_wod_4_rope: bool = False
    heats_wod_4_hold: bool = False
    heats_wod_5: bool = False

    leaderboard_wod_1: bool = False
    leaderboard_wod_2: bool = False
    leaderboard_wod_3: bool = False
    leaderboard_wod_4: bool = False
    leaderboard_wod_5: bool = False
    leaderboard_overall: bool = False

    show_judges: bool = False

    rotate_seconds: int = Field(default=12, ge=3, le=120)


class HeatsDocumentModel(CustomBaseModel):
    event_short_name: str
    payload: dict[str, Any]
    display: HeatsDisplayConfigModel
    updated_at: str | None = None


class HeatsDocumentPutModel(CustomBaseModel):
    payload: dict[str, Any]
    display: HeatsDisplayConfigModel | None = None
