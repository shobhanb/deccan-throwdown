import { StationScheme, WodConfig, WodStation } from 'src/app/config/config';

export type StationStatus = 'done' | 'current' | 'pending' | 'max';

export interface StationProgressRow {
  key: string;
  label: string;
  done: number;
  target: number | null;
  status: StationStatus;
}

export interface StationProgress {
  mode: 'linear' | 'amrap';
  /** Linear: full scheme walk. AMRAP: remainder (partial round) stations only. */
  stations: StationProgressRow[];
  roundsCompleted: number | null;
  hasData: boolean;
}

export interface StationScoreboardView {
  headline: string;
  stations: StationProgressRow[];
  roundsCompleted: number | null;
  mode: 'linear' | 'amrap';
  hasData: boolean;
}

function walkLinear(
  reps: number,
  stations: WodStation[]
): StationProgressRow[] {
  let remaining = Math.max(0, reps);
  const rows: StationProgressRow[] = [];

  for (const station of stations) {
    const target = station.reps ?? null;

    if (target == null) {
      // Open-ended max effort at end of linear scheme.
      if (remaining > 0) {
        rows.push({
          key: station.key,
          label: station.label,
          done: remaining,
          target: null,
          status: 'max',
        });
        remaining = 0;
      } else {
        rows.push({
          key: station.key,
          label: station.label,
          done: 0,
          target: null,
          status: 'pending',
        });
      }
      continue;
    }

    if (remaining >= target) {
      rows.push({
        key: station.key,
        label: station.label,
        done: target,
        target,
        status: 'done',
      });
      remaining -= target;
    } else if (remaining > 0) {
      rows.push({
        key: station.key,
        label: station.label,
        done: remaining,
        target,
        status: 'current',
      });
      remaining = 0;
    } else {
      rows.push({
        key: station.key,
        label: station.label,
        done: 0,
        target,
        status: 'pending',
      });
    }
  }

  // Leftover after all fixed stations (no open-ended station) is ignored for display.
  return rows;
}

function repsPerRound(stations: WodStation[]): number {
  return stations.reduce((sum, station) => sum + (station.reps ?? 0), 0);
}

/** Reps required to complete one full AMRAP round; 0 if not an AMRAP scheme. */
export function stationRepsPerRound(
  scheme: StationScheme | null | undefined
): number {
  if (!scheme || scheme.mode !== 'amrap' || !scheme.stations?.length) {
    return 0;
  }
  return repsPerRound(scheme.stations);
}

export interface AmrapRepParts {
  rounds: number;
  partialReps: number;
}

/** Split a flat AMRAP total into full rounds + remainder reps. */
export function decomposeAmrapReps(
  totalReps: number,
  scheme: StationScheme | null | undefined
): AmrapRepParts | null {
  const perRound = stationRepsPerRound(scheme);
  if (perRound <= 0 || totalReps == null || Number.isNaN(totalReps)) {
    return null;
  }
  const safe = Math.max(0, totalReps);
  return {
    rounds: Math.floor(safe / perRound),
    partialReps: safe % perRound,
  };
}

/** Combine optional rounds + partial reps into a flat AMRAP total. */
export function composeAmrapReps(
  rounds: number | null | undefined,
  partialReps: number | null | undefined,
  scheme: StationScheme | null | undefined
): number | null {
  const perRound = stationRepsPerRound(scheme);
  if (perRound <= 0) {
    return partialReps ?? null;
  }
  const roundCount = rounds ?? 0;
  const partial = partialReps ?? 0;
  if (rounds == null && partialReps == null) {
    return null;
  }
  return roundCount * perRound + partial;
}

function formatStationDone(row: StationProgressRow): string {
  if (row.target == null) {
    return `${row.done} ${row.label}`;
  }
  if (row.status === 'done') {
    return `${row.done} ${row.label}`;
  }
  return `${row.done}/${row.target} ${row.label}`;
}

function linearHeadline(stations: StationProgressRow[]): string {
  const progressed = stations.filter(
    (row) => row.done > 0 || row.status === 'max'
  );
  if (progressed.length === 0) {
    return '';
  }
  return progressed.map((row) => formatStationDone(row)).join(' · ');
}

function amrapHeadline(
  roundsCompleted: number,
  partial: StationProgressRow[]
): string {
  const progressed = partial.filter((row) => row.done > 0);
  const partialPart = progressed.map((row) => formatStationDone(row)).join(' · ');
  const roundLabel =
    roundsCompleted === 1 ? '1 round' : `${roundsCompleted} rounds`;

  if (roundsCompleted > 0 && partialPart) {
    return `${roundLabel} + ${partialPart}`;
  }
  if (roundsCompleted > 0) {
    return roundLabel;
  }
  return partialPart;
}

export function resolveStationScheme(
  wod: WodConfig | null | undefined,
  category: string | null | undefined
): StationScheme | null {
  if (!wod?.stationScheme || wod.scoreDetailType !== 'stations') {
    return null;
  }
  if (category && wod.stationScheme[category]) {
    return wod.stationScheme[category];
  }
  const schemes = Object.values(wod.stationScheme);
  return schemes[0] ?? null;
}

export function buildStationProgress(
  reps: number | null | undefined,
  scheme: StationScheme | null | undefined
): StationProgress | null {
  if (reps == null || Number.isNaN(reps) || !scheme?.stations?.length) {
    return null;
  }

  if (scheme.mode === 'amrap') {
    const perRound = repsPerRound(scheme.stations);
    if (perRound <= 0) {
      return null;
    }
    const roundsCompleted = Math.floor(reps / perRound);
    const remainder = reps % perRound;
    const partial =
      remainder > 0 ? walkLinear(remainder, scheme.stations) : [];
    return {
      mode: 'amrap',
      stations: partial,
      roundsCompleted,
      hasData: true,
    };
  }

  return {
    mode: 'linear',
    stations: walkLinear(reps, scheme.stations),
    roundsCompleted: null,
    hasData: true,
  };
}

export function stationSummaryLines(
  reps: number | null | undefined,
  scheme: StationScheme | null | undefined
): string[] {
  const progress = buildStationProgress(reps, scheme);
  if (!progress?.hasData) {
    return [];
  }

  if (progress.mode === 'amrap') {
    const headline = amrapHeadline(
      progress.roundsCompleted ?? 0,
      progress.stations
    );
    return headline ? [headline] : [];
  }

  const headline = linearHeadline(progress.stations);
  return headline ? [headline] : [];
}

export function stationScoreboardView(
  reps: number | null | undefined,
  scheme: StationScheme | null | undefined
): StationScoreboardView | null {
  const progress = buildStationProgress(reps, scheme);
  if (!progress?.hasData) {
    return null;
  }

  if (progress.mode === 'amrap') {
    const roundsCompleted = progress.roundsCompleted ?? 0;
    return {
      mode: 'amrap',
      headline: amrapHeadline(roundsCompleted, progress.stations),
      stations: progress.stations.filter((row) => row.done > 0),
      roundsCompleted,
      hasData: true,
    };
  }

  return {
    mode: 'linear',
    headline: linearHeadline(progress.stations),
    stations: progress.stations.filter(
      (row) => row.done > 0 || row.status === 'current' || row.status === 'max'
    ),
    roundsCompleted: null,
    hasData: true,
  };
}

/** Compact chip labels for the display board. */
export function stationDisplayChips(
  reps: number | null | undefined,
  scheme: StationScheme | null | undefined
): string[] {
  const view = stationScoreboardView(reps, scheme);
  if (!view?.hasData) {
    return [];
  }

  if (view.mode === 'amrap') {
    const chips: string[] = [];
    if ((view.roundsCompleted ?? 0) > 0) {
      chips.push(
        view.roundsCompleted === 1
          ? '1 round'
          : `${view.roundsCompleted} rounds`
      );
    }
    for (const row of view.stations) {
      chips.push(formatStationDone(row));
    }
    return chips;
  }

  return view.stations.map((row) => formatStationDone(row));
}
