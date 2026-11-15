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
  reps: number | null;
  tiebreak_s?: number | null;
}

export interface TtmmComponentInput {
  athletes: [TtmmAthleteScore, TtmmAthleteScore];
}

export interface TtmmComponentResult {
  total_reps?: number | null;
  total_tiebreak_s?: number | null;
  rank?: number | null;
  points?: number | null;
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

export function emptyTtmmAthlete(): TtmmAthleteFormFields {
  return {
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
  if (athlete.reps == null) {
    return { reps: null, tiebreak_s: null };
  }
  if (!timed) {
    return { reps: athlete.reps };
  }
  const hasTiebreak =
    athlete.tiebreak_minutes != null || athlete.tiebreak_seconds != null;
  const tiebreakSeconds = hasTiebreak
    ? (athlete.tiebreak_minutes || 0) * 60 + (athlete.tiebreak_seconds || 0)
    : TTMM_DEFAULT_TIEBREAK_S;
  return {
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

/** True if any athlete field has been entered (partial submit allowed). */
export function hasAnyTtmmInput(formModel: TtmmFormModel): boolean {
  for (const key of TTMM_COMPONENT_KEYS) {
    for (const athlete of [formModel[key].a1, formModel[key].a2]) {
      if (athlete.reps != null) {
        return true;
      }
      if (athlete.tiebreak_minutes != null || athlete.tiebreak_seconds != null) {
        return true;
      }
    }
  }
  return false;
}

export function isTtmmFormValidPartial(formModel: TtmmFormModel): boolean {
  for (const key of TTMM_COMPONENT_KEYS) {
    for (const athlete of [formModel[key].a1, formModel[key].a2]) {
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

export interface TtmmScoreboardAthleteLine {
  label: string;
  reps: string;
  time: string;
}

export interface TtmmScoreboardComponentView {
  key: TtmmComponentKey;
  label: string;
  athletes: TtmmScoreboardAthleteLine[];
  totalReps: string;
  totalTime: string;
  rank: string;
  points: string;
  complete: boolean;
  hasData: boolean;
}

/** Structured TTMM breakdown for scoreboard / admin lists. */
export function ttmmScoreboardComponents(
  detail: TtmmScoreDetail | null,
  category?: string | null
): TtmmScoreboardComponentView[] {
  if (!detail) {
    return [];
  }

  return TTMM_COMPONENT_KEYS.map((key) => {
    const timed = TTMM_TIMED_COMPONENTS.has(key);
    const athletes = detail.components?.[key]?.athletes ?? [];
    const result = detail.results?.[key];
    const labels = ttmmAthleteLabels(key);
    const athleteLines: TtmmScoreboardAthleteLine[] = [0, 1].map((index) => {
      const athlete = athletes[index];
      const reps =
        athlete?.reps != null ? String(athlete.reps) : '—';
      const time =
        timed && athlete?.tiebreak_s != null
          ? formatTtmmSeconds(athlete.tiebreak_s)
          : timed
            ? '—'
            : '';
      return {
        label: labels[index],
        reps,
        time,
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

    return {
      key,
      label: ttmmComponentLabel(key, category),
      athletes: athleteLines,
      totalReps,
      totalTime,
      rank:
        result?.rank != null
          ? String(result.rank)
          : hasData
            ? '—'
            : '',
      points:
        result?.points != null
          ? String(result.points)
          : hasData
            ? '—'
            : '',
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
    const rankPart = result.rank != null ? `Rank ${result.rank}` : 'partial';
    const pointsPart = result.points != null ? `${result.points}pts` : '';
    const meta = [rankPart, pointsPart].filter(Boolean).join(' ');
    return [
      `${ttmmComponentLabel(key)}: ${result.total_reps}${
        meta ? ` (${meta})` : ''
      }`,
    ];
  });
}
