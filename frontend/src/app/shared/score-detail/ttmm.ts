export type TtmmComponentKey = 'jump_rope' | 'hold' | 'yoke';

export const TTMM_COMPONENT_KEYS: TtmmComponentKey[] = [
  'jump_rope',
  'hold',
  'yoke',
];

export const TTMM_TIMED_COMPONENTS: ReadonlySet<TtmmComponentKey> = new Set([
  'jump_rope',
  'hold',
]);

/** Time cap used when timed-component reps are entered without a tiebreak. */
export const TTMM_DEFAULT_TIEBREAK_S = 4 * 60;

export interface TtmmAthleteScore {
  athlete_id?: string | null;
  reps: number | null;
  tiebreak_s?: number | null;
}

export interface TtmmComponentInput {
  athletes: [TtmmAthleteScore, TtmmAthleteScore];
}

export interface TtmmAthleteResult {
  athlete_id?: string | null;
  reps?: number | null;
  tiebreak_s?: number | null;
  rank?: number | null;
  points?: number | null;
}

export interface TtmmComponentResult {
  athletes?: TtmmAthleteResult[] | null;
  total_reps?: number | null;
  total_tiebreak_s?: number | null;
  complete?: boolean;
}

export interface TtmmResults {
  jump_rope?: TtmmComponentResult | null;
  hold?: TtmmComponentResult | null;
  yoke?: TtmmComponentResult | null;
  total_component_points?: number | null;
}

export interface TtmmScoreDetail {
  type: 'ttmm';
  components: {
    jump_rope?: TtmmComponentInput | null;
    hold?: TtmmComponentInput | null;
    yoke?: TtmmComponentInput | null;
  };
  results?: TtmmResults | null;
}

export interface TtmmAthleteFormFields {
  athlete_id: string | null;
  reps: number | null;
  tiebreak_minutes: number | null;
  tiebreak_seconds: number | null;
}

export interface TtmmComponentFormFields {
  a1: TtmmAthleteFormFields;
  a2: TtmmAthleteFormFields;
}

export interface TtmmFormModel {
  jump_rope: TtmmComponentFormFields;
  hold: TtmmComponentFormFields;
  yoke: TtmmComponentFormFields;
}

export type TtmmAthleteNameLookup = Record<string, string> | null | undefined;

export function emptyTtmmAthlete(): TtmmAthleteFormFields {
  return {
    athlete_id: null,
    reps: null,
    tiebreak_minutes: null,
    tiebreak_seconds: null,
  };
}

export function emptyTtmmForm(): TtmmFormModel {
  return {
    jump_rope: { a1: emptyTtmmAthlete(), a2: emptyTtmmAthlete() },
    hold: { a1: emptyTtmmAthlete(), a2: emptyTtmmAthlete() },
    yoke: { a1: emptyTtmmAthlete(), a2: emptyTtmmAthlete() },
  };
}

export function ttmmComponentLabel(
  key: TtmmComponentKey,
  category?: string | null
): string {
  const scaled = (category || '').toLowerCase().includes('scaled');
  switch (key) {
    case 'jump_rope':
      return scaled ? 'Single Unders' : 'Double Unders';
    case 'hold':
      return scaled ? 'Support Hold' : 'Tuck L-Sit';
    case 'yoke':
      return 'Yoke Carry';
  }
}

/** Athlete slot labels: jump_rope A1/A2, hold A3/A4, yoke A5/A6. */
export function ttmmAthleteLabels(
  key: TtmmComponentKey
): readonly [string, string] {
  switch (key) {
    case 'jump_rope':
      return ['A1', 'A2'];
    case 'hold':
      return ['A3', 'A4'];
    case 'yoke':
      return ['A5', 'A6'];
  }
}

export function parseTtmmScoreDetail(
  raw: string | null | undefined
): TtmmScoreDetail | null {
  if (!raw?.trim()) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<TtmmScoreDetail>;
    if (parsed?.type !== 'ttmm' || !parsed.components) {
      return null;
    }
    return parsed as TtmmScoreDetail;
  } catch {
    return null;
  }
}

function athleteToForm(
  athlete?: TtmmAthleteScore | null
): TtmmAthleteFormFields {
  const tiebreak = athlete?.tiebreak_s ?? null;
  return {
    athlete_id: athlete?.athlete_id ?? null,
    reps: athlete?.reps ?? null,
    tiebreak_minutes:
      tiebreak != null && tiebreak > 0 ? Math.floor(tiebreak / 60) : null,
    tiebreak_seconds:
      tiebreak != null && tiebreak > 0 ? tiebreak % 60 : null,
  };
}

export function ttmmDetailToForm(detail: TtmmScoreDetail | null): TtmmFormModel {
  if (!detail) {
    return emptyTtmmForm();
  }
  const formModel = emptyTtmmForm();
  for (const key of TTMM_COMPONENT_KEYS) {
    const athletes = detail.components?.[key]?.athletes ?? [];
    formModel[key] = {
      a1: athleteToForm(athletes[0]),
      a2: athleteToForm(athletes[1]),
    };
  }
  return formModel;
}

function athleteFromForm(
  athlete: TtmmAthleteFormFields,
  timed: boolean
): TtmmAthleteScore {
  const athleteId = athlete.athlete_id || null;
  if (athlete.reps == null) {
    return { athlete_id: athleteId, reps: null, tiebreak_s: null };
  }
  if (!timed) {
    return { athlete_id: athleteId, reps: athlete.reps };
  }
  const hasTiebreak =
    athlete.tiebreak_minutes != null || athlete.tiebreak_seconds != null;
  const tiebreakSeconds = hasTiebreak
    ? (athlete.tiebreak_minutes || 0) * 60 + (athlete.tiebreak_seconds || 0)
    : TTMM_DEFAULT_TIEBREAK_S;
  return {
    athlete_id: athleteId,
    reps: athlete.reps,
    tiebreak_s: tiebreakSeconds,
  };
}

export function ttmmFormToDetailJson(formModel: TtmmFormModel): string {
  const detail: TtmmScoreDetail = {
    type: 'ttmm',
    components: {
      jump_rope: {
        athletes: [
          athleteFromForm(formModel.jump_rope.a1, true),
          athleteFromForm(formModel.jump_rope.a2, true),
        ],
      },
      hold: {
        athletes: [
          athleteFromForm(formModel.hold.a1, true),
          athleteFromForm(formModel.hold.a2, true),
        ],
      },
      yoke: {
        athletes: [
          athleteFromForm(formModel.yoke.a1, false),
          athleteFromForm(formModel.yoke.a2, false),
        ],
      },
    },
  };
  return JSON.stringify(detail);
}

function iterTtmmFormAthletes(
  formModel: TtmmFormModel
): TtmmAthleteFormFields[] {
  const athletes: TtmmAthleteFormFields[] = [];
  for (const key of TTMM_COMPONENT_KEYS) {
    athletes.push(formModel[key].a1, formModel[key].a2);
  }
  return athletes;
}

/** True if any athlete field has been entered (partial submit allowed). */
export function hasAnyTtmmInput(formModel: TtmmFormModel): boolean {
  for (const athlete of iterTtmmFormAthletes(formModel)) {
    if (athlete.athlete_id) {
      return true;
    }
    if (athlete.reps != null) {
      return true;
    }
    if (athlete.tiebreak_minutes != null || athlete.tiebreak_seconds != null) {
      return true;
    }
  }
  return false;
}

export function ttmmFormHasUniqueAthletes(formModel: TtmmFormModel): boolean {
  const seen = new Set<string>();
  for (const athlete of iterTtmmFormAthletes(formModel)) {
    const id = athlete.athlete_id;
    if (!id) {
      continue;
    }
    if (seen.has(id)) {
      return false;
    }
    seen.add(id);
  }
  return true;
}

export function isTtmmFormValidPartial(formModel: TtmmFormModel): boolean {
  if (!ttmmFormHasUniqueAthletes(formModel)) {
    return false;
  }
  for (const athlete of iterTtmmFormAthletes(formModel)) {
    if (athlete.reps != null && athlete.reps < 0) {
      return false;
    }
    if ((athlete.tiebreak_minutes ?? 0) < 0) {
      return false;
    }
    const seconds = athlete.tiebreak_seconds;
    if (seconds != null && (seconds < 0 || seconds > 59)) {
      return false;
    }
  }
  return hasAnyTtmmInput(formModel);
}

export function formatTtmmSeconds(seconds: number | null | undefined): string {
  if (seconds == null || Number.isNaN(seconds)) {
    return '';
  }
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function resolveAthleteName(
  athleteId: string | null | undefined,
  fallbackLabel: string,
  athleteNameById?: TtmmAthleteNameLookup
): string {
  if (!athleteId || !athleteNameById) {
    return fallbackLabel;
  }
  return athleteNameById[athleteId] ?? fallbackLabel;
}

export interface TtmmScoreboardAthleteLine {
  label: string;
  athleteId: string | null;
  reps: string;
  time: string;
  rank: string;
  points: string;
}

export interface TtmmScoreboardComponentView {
  key: TtmmComponentKey;
  label: string;
  athletes: TtmmScoreboardAthleteLine[];
  totalReps: string;
  totalTime: string;
  /** Sum of athlete points for this component (display only). */
  points: string;
  complete: boolean;
  hasData: boolean;
}

/** Structured TTMM breakdown for scoreboard / admin lists. */
export function ttmmScoreboardComponents(
  detail: TtmmScoreDetail | null,
  category?: string | null,
  athleteNameById?: TtmmAthleteNameLookup
): TtmmScoreboardComponentView[] {
  if (!detail) {
    return [];
  }

  return TTMM_COMPONENT_KEYS.map((key) => {
    const timed = TTMM_TIMED_COMPONENTS.has(key);
    const athletes = detail.components?.[key]?.athletes ?? [];
    const result = detail.results?.[key];
    const resultAthletes = result?.athletes ?? [];
    const labels = ttmmAthleteLabels(key);
    const athleteLines: TtmmScoreboardAthleteLine[] = [0, 1].map((index) => {
      const athlete = athletes[index];
      const athleteResult = resultAthletes[index];
      const athleteId =
        athleteResult?.athlete_id ?? athlete?.athlete_id ?? null;
      const repsValue = athleteResult?.reps ?? athlete?.reps ?? null;
      const tiebreakValue =
        athleteResult?.tiebreak_s ?? athlete?.tiebreak_s ?? null;
      const reps = repsValue != null ? String(repsValue) : '—';
      const time =
        timed && tiebreakValue != null
          ? formatTtmmSeconds(tiebreakValue)
          : timed
            ? '—'
            : '';
      return {
        label: resolveAthleteName(athleteId, labels[index], athleteNameById),
        athleteId,
        reps,
        time,
        rank:
          athleteResult?.rank != null
            ? String(athleteResult.rank)
            : repsValue != null
              ? '—'
              : '',
        points:
          athleteResult?.points != null
            ? String(athleteResult.points)
            : repsValue != null
              ? '—'
              : '',
      };
    });

    const hasAthleteData = athletes.some((athlete) => athlete?.reps != null);
    const hasResultData = result?.total_reps != null;
    const hasData = hasAthleteData || hasResultData;

    let totalReps = '—';
    let totalTime = '';
    if (result?.total_reps != null) {
      totalReps = String(result.total_reps);
      if (timed && result.total_tiebreak_s != null) {
        totalTime = formatTtmmSeconds(result.total_tiebreak_s);
      }
    } else if (hasAthleteData) {
      totalReps = String(
        athletes.reduce((sum, athlete) => sum + (athlete.reps || 0), 0)
      );
      if (timed) {
        const tb = athletes.reduce(
          (sum, athlete) => sum + (athlete.tiebreak_s || 0),
          0
        );
        totalTime = formatTtmmSeconds(tb);
      }
    }

    const athletePoints = resultAthletes
      .map((athlete) => athlete?.points)
      .filter((points): points is number => points != null);
    const points =
      athletePoints.length > 0
        ? String(athletePoints.reduce((sum, value) => sum + value, 0))
        : hasData
          ? '—'
          : '';

    return {
      key,
      label: ttmmComponentLabel(key, category),
      athletes: athleteLines,
      totalReps,
      totalTime,
      points,
      complete: result?.complete === true,
      hasData,
    };
  }).filter((row) => row.hasData);
}

export function ttmmSummaryLines(detail: TtmmScoreDetail | null): string[] {
  if (!detail?.results) {
    if (!detail) {
      return [];
    }
    return TTMM_COMPONENT_KEYS.flatMap((key) => {
      const athletes = detail.components[key]?.athletes ?? [];
      const entered = athletes.filter((a) => a.reps != null);
      if (entered.length === 0) {
        return [];
      }
      const total = entered.reduce((sum, a) => sum + (a.reps || 0), 0);
      return [`${ttmmComponentLabel(key)}: ${total}`];
    });
  }
  return TTMM_COMPONENT_KEYS.flatMap((key) => {
    const result = detail.results?.[key];
    if (!result || result.total_reps == null) {
      return [];
    }
    const athletePoints = (result.athletes ?? [])
      .map((athlete) => athlete.points)
      .filter((points): points is number => points != null);
    const pointsSum =
      athletePoints.length > 0
        ? athletePoints.reduce((sum, value) => sum + value, 0)
        : null;
    const ranked = (result.athletes ?? []).filter(
      (athlete) => athlete.rank != null
    ).length;
    const rankPart =
      ranked > 0 ? `${ranked} ranked` : result.complete ? 'complete' : 'partial';
    const pointsPart = pointsSum != null ? `${pointsSum}pts` : '';
    const meta = [rankPart, pointsPart].filter(Boolean).join(' ');
    return [
      `${ttmmComponentLabel(key)}: ${result.total_reps}${
        meta ? ` (${meta})` : ''
      }`,
    ];
  });
}
