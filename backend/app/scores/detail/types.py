from __future__ import annotations

from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

TTMM_COMPONENT_KEYS = ("jump_rope", "hold", "yoke")
TTMM_TIMED_COMPONENTS = frozenset({"jump_rope", "hold"})
# Time cap used when timed-component reps are entered without a tiebreak.
TTMM_DEFAULT_TIEBREAK_S = 4 * 60


class TtmmAthleteScore(BaseModel):
    athlete_id: UUID | None = None
    reps: int | None = Field(default=None, ge=0)
    tiebreak_s: int | None = Field(default=None, ge=0)


class TtmmComponentInput(BaseModel):
    athletes: list[TtmmAthleteScore] = Field(default_factory=list)

    @field_validator("athletes")
    @classmethod
    def at_most_two_athletes(
        cls, value: list[TtmmAthleteScore]
    ) -> list[TtmmAthleteScore]:
        if len(value) > 2:
            raise ValueError("each TTMM component allows at most 2 athletes")
        return value


class TtmmComponents(BaseModel):
    jump_rope: TtmmComponentInput | None = None
    hold: TtmmComponentInput | None = None
    yoke: TtmmComponentInput | None = None


class TtmmAthleteResult(BaseModel):
    athlete_id: UUID | None = None
    reps: int | None = None
    tiebreak_s: int | None = None
    rank: int | None = None
    points: int | None = None


class TtmmComponentResult(BaseModel):
    athletes: list[TtmmAthleteResult] = Field(default_factory=list)
    total_reps: int | None = None
    total_tiebreak_s: int | None = None
    complete: bool = False


class TtmmResults(BaseModel):
    jump_rope: TtmmComponentResult | None = None
    hold: TtmmComponentResult | None = None
    yoke: TtmmComponentResult | None = None
    total_component_points: int | None = None


class TtmmScoreDetail(BaseModel):
    type: Literal["ttmm"] = "ttmm"
    components: TtmmComponents
    results: TtmmResults | None = None


def apply_ttmm_default_tiebreaks(detail: TtmmScoreDetail) -> TtmmScoreDetail:
    """For jump_rope/hold: if reps are set and tiebreak is missing, use 4:00."""
    components = detail.components
    for key in TTMM_TIMED_COMPONENTS:
        component = getattr(components, key)
        if component is None:
            continue
        updated_athletes: list[TtmmAthleteScore] = []
        changed = False
        for athlete in component.athletes:
            if athlete.reps is not None and athlete.tiebreak_s is None:
                updated_athletes.append(
                    athlete.model_copy(update={"tiebreak_s": TTMM_DEFAULT_TIEBREAK_S})
                )
                changed = True
            else:
                updated_athletes.append(athlete)
        if changed:
            setattr(
                components,
                key,
                component.model_copy(update={"athletes": updated_athletes}),
            )
    return detail


def _padded_athletes(component: TtmmComponentInput | None) -> list[TtmmAthleteScore]:
    athletes = list(component.athletes) if component else []
    while len(athletes) < 2:
        athletes.append(TtmmAthleteScore())
    return athletes[:2]


def athlete_is_scorable(athlete: TtmmAthleteScore, *, timed: bool) -> bool:
    if athlete.reps is None:
        return False
    return not (timed and athlete.tiebreak_s is None)


def component_is_complete(
    component: TtmmComponentInput | None,
    *,
    timed: bool,
) -> bool:
    athletes = _padded_athletes(component)
    return all(athlete_is_scorable(athlete, timed=timed) for athlete in athletes)


def component_totals(
    component: TtmmComponentInput | None,
    *,
    timed: bool,
) -> tuple[int | None, int | None]:
    """Sum entered athlete values. Returns (None, None) if no athlete has reps."""
    athletes = _padded_athletes(component)
    entered = [athlete for athlete in athletes if athlete.reps is not None]
    if not entered:
        return None, None
    total_reps = sum(athlete.reps or 0 for athlete in entered)
    if not timed:
        return total_reps, None
    total_tiebreak = sum(athlete.tiebreak_s or 0 for athlete in entered)
    return total_reps, total_tiebreak


def timed_component_sort_key(reps: int, tiebreak_s: int) -> tuple[float, float]:
    return (-reps, float(tiebreak_s))


def yoke_component_sort_key(reps: int) -> tuple[float]:
    return (-reps,)


def iter_ttmm_athlete_ids(detail: TtmmScoreDetail) -> list[UUID]:
    ids: list[UUID] = []
    for key in TTMM_COMPONENT_KEYS:
        component = getattr(detail.components, key)
        if component is None:
            continue
        for athlete in component.athletes:
            if athlete.athlete_id is not None:
                ids.append(athlete.athlete_id)
    return ids


def validate_ttmm_roster_ids(
    detail: TtmmScoreDetail,
    team_athlete_ids: set[UUID],
) -> None:
    """Ensure assigned athlete_ids belong to the team and appear at most once."""
    seen: set[UUID] = set()
    for athlete_id in iter_ttmm_athlete_ids(detail):
        if athlete_id not in team_athlete_ids:
            raise ValueError(f"athlete_id {athlete_id} is not on this team")
        if athlete_id in seen:
            raise ValueError(f"athlete_id {athlete_id} is assigned more than once")
        seen.add(athlete_id)
