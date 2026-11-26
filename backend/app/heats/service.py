from __future__ import annotations

import json
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection, AsyncSession
from sqlalchemy.orm.attributes import flag_modified

from app.heats.models import HeatsDocument
from app.heats.schemas import HeatsDisplayConfigModel, HeatsDocumentModel

SEED_DIR = Path(__file__).resolve().parent / "seed"


def default_display_dict() -> dict[str, Any]:
    return HeatsDisplayConfigModel().model_dump()


def _clamp_rotate_seconds(value: Any) -> int:
    try:
        seconds = int(value)
    except (TypeError, ValueError):
        return 12
    return max(3, min(120, seconds))


def _as_bool(value: Any, default: bool = False) -> bool:
    if value is None:
        return default
    return bool(value)


def normalize_display_dict(raw: dict[str, Any] | None) -> dict[str, Any]:
    """Accept snake_case API fields or legacy camelCase / old flag names."""
    raw = raw or {}

    def pick(*keys: str, default: bool = False) -> bool:
        for key in keys:
            if key in raw:
                return _as_bool(raw[key], default)
        return default

    # Legacy: wod1..wod5 / day1 / day2 → spread across new groups when new keys absent.
    legacy_wod = any(f"wod{i}" in raw for i in range(1, 6)) or any(
        f"wod_{i}" in raw for i in range(1, 6)
    )
    has_new = any(
        key.startswith("wod_desc_")
        or key.startswith("heats_wod_")
        or key.startswith("leaderboard_")
        or key.startswith("wodDesc")
        or key.startswith("heatsWod")
        or key.startswith("leaderboard")
        for key in raw
    )

    if legacy_wod and not has_new:
        return HeatsDisplayConfigModel(
            pics=pick("pics", default=True),
            wod_desc_1=pick("wod1", "wod_1"),
            wod_desc_2=pick("wod2", "wod_2"),
            wod_desc_3=pick("wod3", "wod_3"),
            wod_desc_4=pick("wod4", "wod_4"),
            wod_desc_5=pick("wod5", "wod_5"),
            heats_wod_1=pick("wod1", "wod_1", "day1", "display_day1"),
            heats_wod_2=pick("wod2", "wod_2", "day1", "display_day1"),
            heats_wod_3=pick("wod3", "wod_3", "day2", "display_day2"),
            heats_wod_4_ttmm=pick("wod4", "wod_4", "day1", "display_day1"),
            heats_wod_4_rope=pick("wod4", "wod_4", "day2", "display_day2"),
            heats_wod_4_hold=pick("wod4", "wod_4", "day2", "display_day2"),
            heats_wod_5=pick("wod5", "wod_5", "day2", "display_day2"),
            leaderboard_wod_1=pick("wod1", "wod_1"),
            leaderboard_wod_2=pick("wod2", "wod_2"),
            leaderboard_wod_3=pick("wod3", "wod_3"),
            leaderboard_wod_4=pick("wod4", "wod_4"),
            leaderboard_wod_5=pick("wod5", "wod_5"),
            leaderboard_overall=True,
            show_judges=pick("show_judges", "showJudges", default=False),
            rotate_seconds=_clamp_rotate_seconds(
                raw.get("rotate_seconds", raw.get("rotateSeconds", 12))
            ),
        ).model_dump()

    return HeatsDisplayConfigModel(
        pics=pick("pics", default=True),
        wod_desc_1=pick("wod_desc_1", "wodDesc1", default=True),
        wod_desc_2=pick("wod_desc_2", "wodDesc2", default=True),
        wod_desc_3=pick("wod_desc_3", "wodDesc3", default=True),
        wod_desc_4=pick("wod_desc_4", "wodDesc4", default=True),
        wod_desc_5=pick("wod_desc_5", "wodDesc5", default=True),
        heats_wod_1=pick("heats_wod_1", "heatsWod1"),
        heats_wod_2=pick("heats_wod_2", "heatsWod2"),
        heats_wod_3=pick("heats_wod_3", "heatsWod3"),
        heats_wod_4_ttmm=pick("heats_wod_4_ttmm", "heatsWod4Ttmm"),
        heats_wod_4_rope=pick("heats_wod_4_rope", "heatsWod4Rope"),
        heats_wod_4_hold=pick("heats_wod_4_hold", "heatsWod4Hold"),
        heats_wod_5=pick("heats_wod_5", "heatsWod5"),
        leaderboard_wod_1=pick("leaderboard_wod_1", "leaderboardWod1"),
        leaderboard_wod_2=pick("leaderboard_wod_2", "leaderboardWod2"),
        leaderboard_wod_3=pick("leaderboard_wod_3", "leaderboardWod3"),
        leaderboard_wod_4=pick("leaderboard_wod_4", "leaderboardWod4"),
        leaderboard_wod_5=pick("leaderboard_wod_5", "leaderboardWod5"),
        leaderboard_overall=pick("leaderboard_overall", "leaderboardOverall"),
        show_judges=pick("show_judges", "showJudges", default=False),
        rotate_seconds=_clamp_rotate_seconds(
            raw.get("rotate_seconds", raw.get("rotateSeconds", 12))
        ),
    ).model_dump()


def display_from_row(doc: HeatsDocument) -> HeatsDisplayConfigModel:
    raw = doc.display if isinstance(doc.display, dict) else {}
    return HeatsDisplayConfigModel.model_validate(normalize_display_dict(raw))


def apply_display_to_row(doc: HeatsDocument, display: HeatsDisplayConfigModel) -> None:
    doc.display = display.model_dump()
    flag_modified(doc, "display")


def _strip_heat_extras(heat: dict[str, Any]) -> dict[str, Any]:
    """Keep only schedule fields on a heat (heat number = array index + 1)."""
    out: dict[str, Any] = {
        "entries": heat.get("entries") or [],
    }
    if heat.get("startTime"):
        out["startTime"] = heat["startTime"]
    return out


def _clean_block(block: dict[str, Any]) -> dict[str, Any]:
    return {
        "wodNumber": block.get("wodNumber"),
        "wodLabel": block.get("wodLabel"),
        "division": block.get("division"),
        "heats": [
            _strip_heat_extras(h)
            for h in (block.get("heats") or [])
            if isinstance(h, dict)
        ],
    }


def _raw_blocks_from_payload(payload: dict[str, Any]) -> list[Any]:
    """Accept flat `{ blocks }` or legacy `{ days: [{ blocks }] }`."""
    blocks = payload.get("blocks")
    if isinstance(blocks, list):
        return blocks
    days_in = payload.get("days")
    if not isinstance(days_in, list):
        return []
    out: list[Any] = []
    for day in days_in:
        if not isinstance(day, dict):
            continue
        for block in day.get("blocks") or []:
            out.append(block)
    return out


def clean_schedule_payload(payload: dict[str, Any]) -> dict[str, Any]:
    """Strip meta extras; keep flat blocks schedule for storage/editor."""
    blocks_out = [
        _clean_block(block)
        for block in _raw_blocks_from_payload(payload)
        if isinstance(block, dict)
    ]
    return {"blocks": blocks_out}


def extract_display_from_payload(
    payload: dict[str, Any],
) -> tuple[dict[str, Any], HeatsDisplayConfigModel]:
    raw_payload = dict(payload)
    raw = raw_payload.pop("display", None)
    raw_payload.pop("forceDay", None)
    cleaned = clean_schedule_payload(raw_payload)
    if isinstance(raw, dict):
        return cleaned, HeatsDisplayConfigModel.model_validate(
            normalize_display_dict(raw)
        )
    return cleaned, HeatsDisplayConfigModel()


def _legacy_columns_to_display(doc: HeatsDocument) -> dict[str, Any] | None:
    """Build a display dict from old display_* columns if present on the row."""
    if not hasattr(doc, "display_pics") and not hasattr(doc, "display_day1"):
        return None
    # SQLAlchemy may still expose leftover attrs after migration; prefer JSON.
    if isinstance(doc.display, dict) and doc.display:
        return None
    try:
        return normalize_display_dict(
            {
                "pics": getattr(doc, "display_pics", True),
                "day1": getattr(doc, "display_day1", True),
                "day2": getattr(doc, "display_day2", False),
                "wod1": getattr(doc, "display_wod1", False),
                "wod2": getattr(doc, "display_wod2", False),
                "wod3": getattr(doc, "display_wod3", False),
                "wod4": getattr(doc, "display_wod4", False),
                "wod5": getattr(doc, "display_wod5", False),
                "rotate_seconds": getattr(doc, "display_rotate_seconds", 12),
            }
        )
    except Exception:
        return None


def _to_model(doc: HeatsDocument) -> HeatsDocumentModel:
    updated = doc.updated_at
    updated_at = None
    if updated is not None:
        if updated.tzinfo is None:
            updated = updated.replace(tzinfo=UTC)
        updated_at = updated.isoformat()
    return HeatsDocumentModel(
        event_short_name=doc.event_short_name,
        payload=doc.payload,
        display=display_from_row(doc),
        updated_at=updated_at,
    )


def load_seed_payload(event_short_name: str) -> dict[str, Any] | None:
    path = SEED_DIR / f"{event_short_name}.json"
    if not path.is_file():
        return None
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


async def ensure_heats_display_columns(conn: AsyncConnection) -> None:
    """Ensure heats_document.display JSON column exists (SQLite)."""
    result = await conn.execute(text("PRAGMA table_info(heats_document)"))
    existing = {row[1] for row in result.fetchall()}
    if not existing:
        return
    if "display" not in existing:
        await conn.execute(
            text(
                "ALTER TABLE heats_document ADD COLUMN display JSON NOT NULL DEFAULT '{}'"
            )
        )


async def get_heats_document(
    db_session: AsyncSession, event_short_name: str
) -> HeatsDocumentModel | None:
    doc = await HeatsDocument.find(db_session, event_short_name=event_short_name)
    if doc is not None:
        dirty = False
        payload = doc.payload if isinstance(doc.payload, dict) else {}
        if "display" in payload or "forceDay" in payload:
            cleaned, migrated = extract_display_from_payload(payload)
            doc.payload = cleaned
            flag_modified(doc, "payload")
            apply_display_to_row(doc, migrated)
            dirty = True
        else:
            cleaned = clean_schedule_payload(payload)
            if cleaned != payload:
                doc.payload = cleaned
                flag_modified(doc, "payload")
                dirty = True
        if not isinstance(doc.display, dict) or not doc.display:
            legacy = _legacy_columns_to_display(doc)
            apply_display_to_row(
                doc,
                HeatsDisplayConfigModel.model_validate(
                    legacy or default_display_dict()
                ),
            )
            dirty = True
        else:
            # Re-normalize in case of partial/legacy keys.
            normalized = normalize_display_dict(doc.display)
            if normalized != doc.display:
                doc.display = normalized
                flag_modified(doc, "display")
                dirty = True
        if dirty:
            await db_session.commit()
            await db_session.refresh(doc)
        return _to_model(doc)

    seed = load_seed_payload(event_short_name)
    if seed is None:
        return None

    cleaned, display = extract_display_from_payload(seed)
    doc = HeatsDocument(
        event_short_name=event_short_name,
        payload=cleaned,
        display=display.model_dump(),
    )
    db_session.add(doc)
    await db_session.commit()
    await db_session.refresh(doc)
    return _to_model(doc)


async def put_heats_document(
    db_session: AsyncSession,
    event_short_name: str,
    payload: dict[str, Any],
    display: HeatsDisplayConfigModel | None = None,
) -> HeatsDocumentModel:
    cleaned, legacy_display = extract_display_from_payload(payload)

    doc = await HeatsDocument.find(db_session, event_short_name=event_short_name)
    if doc is None:
        resolved = display or legacy_display
        doc = HeatsDocument(
            event_short_name=event_short_name,
            payload=cleaned,
            display=resolved.model_dump(),
        )
        db_session.add(doc)
    else:
        doc.payload = cleaned
        flag_modified(doc, "payload")
        if display is not None:
            apply_display_to_row(doc, display)
        elif "display" in payload:
            apply_display_to_row(doc, legacy_display)
        doc.updated_at = datetime.now(UTC)
    await db_session.commit()
    await db_session.refresh(doc)
    return _to_model(doc)
