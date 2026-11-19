import { apiScoreOutputModel } from 'src/app/api/models/api-score-output-model';
import { apiTeamsOutputDetailModel } from 'src/app/api/models/api-teams-output-detail-model';

export type DisplayRowStatus = 'verified' | 'pending' | 'awaiting';

export type StandingsView =
  | { kind: 'overall' }
  | { kind: 'wod'; wodNumber: number };

export type DisplaySlide =
  | { kind: 'standings'; category: string; view: StandingsView }
  | { kind: 'gallery'; images: string[] }
  | { kind: 'wodInfo'; wodNumber: number };

export interface DisplayRow {
  teamId: string;
  teamName: string;
  rank: number | null;
  status: DisplayRowStatus;
  scoreLabel: string;
  pointsLabel: string | null;
  score: apiScoreOutputModel | null;
}

export function verifiedTeams(
  teams: apiTeamsOutputDetailModel[]
): apiTeamsOutputDetailModel[] {
  return teams.filter((team) => team.verified);
}

export function scoreForWod(
  team: apiTeamsOutputDetailModel,
  wodNumber: number
): apiScoreOutputModel | undefined {
  return team.scores.find((score) => score.wod_number === wodNumber);
}

/** True when any verified team has at least one score row. */
export function hasAnyScoreData(teams: apiTeamsOutputDetailModel[]): boolean {
  return verifiedTeams(teams).some((team) => team.scores.length > 0);
}

/** True when every verified team has a verified score for this WOD. */
export function isWodComplete(
  wodNumber: number,
  teams: apiTeamsOutputDetailModel[]
): boolean {
  const verified = verifiedTeams(teams);
  if (verified.length === 0) {
    return false;
  }
  return verified.every((team) => {
    const score = scoreForWod(team, wodNumber);
    return !!score?.verified;
  });
}

/**
 * Active when at least one verified team has a score row for the WOD and not
 * every verified team has a verified score for it.
 */
export function isWodActive(
  wodNumber: number,
  teams: apiTeamsOutputDetailModel[]
): boolean {
  const verified = verifiedTeams(teams);
  if (verified.length === 0) {
    return false;
  }
  const hasAnyScore = verified.some(
    (team) => scoreForWod(team, wodNumber) != null
  );
  return hasAnyScore && !isWodComplete(wodNumber, teams);
}

/** Highest active WOD number, or null when none are active. */
export function findActiveWod(
  wodNumbers: number[],
  teams: apiTeamsOutputDetailModel[]
): number | null {
  const active = wodNumbers
    .filter((wodNumber) => isWodActive(wodNumber, teams))
    .sort((a, b) => b - a);
  return active[0] ?? null;
}

/** True when a verified team in the category has a score row for this WOD. */
export function categoryHasWodData(
  category: string,
  wodNumber: number,
  teams: apiTeamsOutputDetailModel[]
): boolean {
  return verifiedTeams(teams).some(
    (team) =>
      team.category === category && scoreForWod(team, wodNumber) != null
  );
}

/**
 * True when a verified team in the category has at least one verified score
 * (overall standings have something to show).
 */
export function categoryHasOverallData(
  category: string,
  teams: apiTeamsOutputDetailModel[]
): boolean {
  return verifiedTeams(teams).some(
    (team) =>
      team.category === category &&
      team.scores.some((score) => score.verified)
  );
}

/**
 * Idle slides: per category Overall, then each complete WOD.
 * Skips category/view pairs with no data.
 */
export function buildIdleSlides(
  categories: string[],
  wodNumbers: number[],
  teams: apiTeamsOutputDetailModel[]
): DisplaySlide[] {
  const completeWods = wodNumbers.filter((wodNumber) =>
    isWodComplete(wodNumber, teams)
  );
  const slides: DisplaySlide[] = [];
  for (const category of categories) {
    if (categoryHasOverallData(category, teams)) {
      slides.push({
        kind: 'standings',
        category,
        view: { kind: 'overall' },
      });
    }
    for (const wodNumber of completeWods) {
      if (categoryHasWodData(category, wodNumber, teams)) {
        slides.push({
          kind: 'standings',
          category,
          view: { kind: 'wod', wodNumber },
        });
      }
    }
  }
  return slides;
}

/**
 * Live slides: per category active WOD, then Overall.
 * Skips category/view pairs with no data.
 */
export function buildLiveSlides(
  categories: string[],
  activeWod: number,
  teams: apiTeamsOutputDetailModel[]
): DisplaySlide[] {
  const slides: DisplaySlide[] = [];
  for (const category of categories) {
    if (categoryHasWodData(category, activeWod, teams)) {
      slides.push({
        kind: 'standings',
        category,
        view: { kind: 'wod', wodNumber: activeWod },
      });
    }
    if (categoryHasOverallData(category, teams)) {
      slides.push({
        kind: 'standings',
        category,
        view: { kind: 'overall' },
      });
    }
  }
  return slides;
}

export function shuffleArray<T>(
  array: T[],
  random: () => number = Math.random
): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function chunkImages(paths: string[], groupSize = 4): string[][] {
  const groups: string[][] = [];
  for (let i = 0; i < paths.length; i += groupSize) {
    groups.push(paths.slice(i, i + groupSize));
  }
  return groups;
}

/**
 * Pre-score slides: alternate gallery groups (max 4 images) with one WOD
 * info page each. Re-shuffle paths each call for variety.
 */
export function buildPreviewSlides(
  wodNumbers: number[],
  imagePaths: string[],
  options?: { groupSize?: number; random?: () => number }
): DisplaySlide[] {
  const groupSize = options?.groupSize ?? 4;
  const random = options?.random ?? Math.random;
  const groups = chunkImages(shuffleArray(imagePaths, random), groupSize);
  const slides: DisplaySlide[] = [];
  let galleryIndex = 0;

  for (const wodNumber of wodNumbers) {
    if (groups.length > 0) {
      slides.push({
        kind: 'gallery',
        images: groups[galleryIndex % groups.length],
      });
      galleryIndex += 1;
    }
    slides.push({ kind: 'wodInfo', wodNumber });
  }

  if (wodNumbers.length === 0) {
    for (const images of groups) {
      slides.push({ kind: 'gallery', images });
    }
  }

  return slides;
}

export function convertSecondsToMinutes(
  seconds: number | null | undefined
): string {
  if (seconds == null || isNaN(seconds)) {
    return '';
  }
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatScoreLabel(
  score: apiScoreOutputModel | null | undefined
): string {
  if (!score) {
    return '—';
  }
  const parts: string[] = [];
  if (score.reps != null) {
    parts.push(`${score.reps}`);
  }
  if (score.time_s != null) {
    parts.push(convertSecondsToMinutes(score.time_s));
  }
  if (score.tiebreak_s != null) {
    parts.push(`TB ${convertSecondsToMinutes(score.tiebreak_s)}`);
  }
  return parts.length > 0 ? parts.join(' · ') : '—';
}

export function totalVerifiedPoints(team: apiTeamsOutputDetailModel): number {
  return team.scores
    .filter((score) => score.verified && score.wod_points != null)
    .reduce((sum, score) => sum + (score.wod_points || 0), 0);
}

export function buildLiveRows(
  teams: apiTeamsOutputDetailModel[],
  category: string,
  wodNumber: number
): DisplayRow[] {
  const categoryTeams = verifiedTeams(teams).filter(
    (team) => team.category === category
  );

  const verifiedRows: DisplayRow[] = [];

  for (const team of categoryTeams) {
    const score = scoreForWod(team, wodNumber) ?? null;
    if (!score?.verified) {
      continue;
    }
    verifiedRows.push({
      teamId: team.id,
      teamName: team.team_name,
      rank: score.wod_rank ?? null,
      status: 'verified',
      scoreLabel: formatScoreLabel(score),
      pointsLabel:
        score.wod_points != null ? `${score.wod_points} pts` : null,
      score,
    });
  }

  return verifiedRows.sort(
    (a, b) => (a.rank ?? 999999) - (b.rank ?? 999999)
  );
}

export function buildIdleOverallRows(
  teams: apiTeamsOutputDetailModel[],
  category: string
): DisplayRow[] {
  return verifiedTeams(teams)
    .filter((team) => team.category === category)
    .map((team) => {
      const points = totalVerifiedPoints(team);
      return {
        teamId: team.id,
        teamName: team.team_name,
        rank: team.overall_rank ?? null,
        status: 'verified' as const,
        scoreLabel: `${points} pts`,
        pointsLabel: null,
        score: null,
      };
    })
    .sort((a, b) => (a.rank ?? 999999) - (b.rank ?? 999999));
}

export function buildIdleWodRows(
  teams: apiTeamsOutputDetailModel[],
  category: string,
  wodNumber: number
): DisplayRow[] {
  const rows: DisplayRow[] = [];
  for (const team of verifiedTeams(teams)) {
    if (team.category !== category) {
      continue;
    }
    const score = scoreForWod(team, wodNumber);
    if (!score?.verified) {
      continue;
    }
    rows.push({
      teamId: team.id,
      teamName: team.team_name,
      rank: score.wod_rank ?? null,
      status: 'verified',
      scoreLabel: formatScoreLabel(score),
      pointsLabel: score.wod_points != null ? `${score.wod_points} pts` : null,
      score,
    });
  }
  return rows.sort((a, b) => (a.rank ?? 999999) - (b.rank ?? 999999));
}

export function buildRowsForSlide(
  teams: apiTeamsOutputDetailModel[],
  slide: DisplaySlide,
  live: boolean
): DisplayRow[] {
  if (slide.kind !== 'standings') {
    return [];
  }
  if (live && slide.view.kind === 'wod') {
    return buildLiveRows(teams, slide.category, slide.view.wodNumber);
  }
  if (slide.view.kind === 'overall') {
    return buildIdleOverallRows(teams, slide.category);
  }
  return buildIdleWodRows(teams, slide.category, slide.view.wodNumber);
}
