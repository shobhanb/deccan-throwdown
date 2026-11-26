import { apiScoreOutputModel } from 'src/app/api/models/api-score-output-model';
import { apiTeamsOutputDetailModel } from 'src/app/api/models/api-teams-output-detail-model';
import {
  buildHeatsSlides,
  HeatsSlideRef,
  normalizeHeatsDisplayConfig,
} from './heats-logic';
import { HeatsDisplayConfig, HeatsPayload } from './heats-types';

export type DisplayRowStatus = 'verified' | 'pending' | 'awaiting';

export type StandingsView =
  | { kind: 'overall' }
  | { kind: 'wod'; wodNumber: number };

export type DisplaySlide =
  | { kind: 'standings'; category: string; view: StandingsView }
  | { kind: 'gallery'; images: string[] }
  | { kind: 'wodInfo'; wodNumber: number }
  | HeatsSlideRef;

export interface DisplayRow {
  teamId: string;
  teamName: string;
  athleteNames: string[];
  rank: number | null;
  status: DisplayRowStatus;
  scoreLabel: string;
  pointsLabel: string | null;
  score: apiScoreOutputModel | null;
}

export function athleteNamesForTeam(
  team: apiTeamsOutputDetailModel
): string[] {
  return (team.athletes ?? []).map(
    (athlete) => `${athlete.first_name} ${athlete.last_name}`.trim()
  );
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

/** True when a verified team in the category has a verified score for this WOD. */
export function categoryHasVerifiedWodData(
  category: string,
  wodNumber: number,
  teams: apiTeamsOutputDetailModel[]
): boolean {
  return verifiedTeams(teams).some(
    (team) =>
      team.category === category && !!scoreForWod(team, wodNumber)?.verified
  );
}

/** True when any verified team has a verified score for this WOD. */
export function wodHasVerifiedScores(
  wodNumber: number,
  teams: apiTeamsOutputDetailModel[]
): boolean {
  return verifiedTeams(teams).some(
    (team) => !!scoreForWod(team, wodNumber)?.verified
  );
}

/** How many configured WODs have at least one submitted score. */
export function countWodsWithScores(
  wodNumbers: number[],
  teams: apiTeamsOutputDetailModel[]
): number {
  return wodNumbers.filter((wodNumber) =>
    verifiedTeams(teams).some((team) => scoreForWod(team, wodNumber) != null)
  ).length;
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

/** WODs that have at least one verified score, active WOD first when present. */
export function wodsWithVerifiedLeaderboards(
  wodNumbers: number[],
  teams: apiTeamsOutputDetailModel[],
  activeWod?: number | null
): number[] {
  const withVerified = wodNumbers.filter((wodNumber) =>
    wodHasVerifiedScores(wodNumber, teams)
  );
  if (activeWod == null || !withVerified.includes(activeWod)) {
    return withVerified;
  }
  return [
    activeWod,
    ...withVerified.filter((wodNumber) => wodNumber !== activeWod),
  ];
}

/**
 * Idle slides: per category Overall, then each WOD with verified scores.
 * Skips category/view pairs with no verified data.
 */
export function buildIdleSlides(
  categories: string[],
  wodNumbers: number[],
  teams: apiTeamsOutputDetailModel[]
): DisplaySlide[] {
  const leaderboardWods = wodsWithVerifiedLeaderboards(wodNumbers, teams);
  const slides: DisplaySlide[] = [];
  for (const category of categories) {
    if (categoryHasOverallData(category, teams)) {
      slides.push({
        kind: 'standings',
        category,
        view: { kind: 'overall' },
      });
    }
    for (const wodNumber of leaderboardWods) {
      if (categoryHasVerifiedWodData(category, wodNumber, teams)) {
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

export interface LiveSlidesOptions {
  wodNumbers?: number[];
  imagePaths?: string[];
  groupSize?: number;
  random?: () => number;
}

/**
 * Live slides while a WOD is active:
 * - Leaderboard for every WOD that has verified scores
 * - If the active WOD has none verified yet: WOD info page
 * - Overall when verified scores exist
 * - If only one WOD has scores yet: rotate with gallery images
 */
export function buildLiveSlides(
  categories: string[],
  activeWod: number,
  teams: apiTeamsOutputDetailModel[],
  options?: LiveSlidesOptions
): DisplaySlide[] {
  const slides: DisplaySlide[] = [];
  const wodNumbers = options?.wodNumbers ?? [activeWod];
  const leaderboardWods = wodsWithVerifiedLeaderboards(
    wodNumbers,
    teams,
    activeWod
  );

  if (!wodHasVerifiedScores(activeWod, teams)) {
    slides.push({ kind: 'wodInfo', wodNumber: activeWod });
  }

  for (const category of categories) {
    for (const wodNumber of leaderboardWods) {
      if (categoryHasVerifiedWodData(category, wodNumber, teams)) {
        slides.push({
          kind: 'standings',
          category,
          view: { kind: 'wod', wodNumber },
        });
      }
    }
    if (categoryHasOverallData(category, teams)) {
      slides.push({
        kind: 'standings',
        category,
        view: { kind: 'overall' },
      });
    }
  }

  const imagePaths = options?.imagePaths ?? [];
  const onlyOneWodInProgress =
    wodNumbers.length === 0
      ? true
      : countWodsWithScores(wodNumbers, teams) <= 1;

  if (onlyOneWodInProgress && imagePaths.length > 0 && slides.length > 0) {
    return interleaveGalleryBeforeEach(slides, imagePaths, options);
  }

  return slides;
}

/** Place a gallery group before each content slide (max 4 images per group). */
export function interleaveGalleryBeforeEach(
  contentSlides: DisplaySlide[],
  imagePaths: string[],
  options?: { groupSize?: number; random?: () => number }
): DisplaySlide[] {
  if (contentSlides.length === 0 || imagePaths.length === 0) {
    return contentSlides;
  }
  const groupSize = options?.groupSize ?? 4;
  const random = options?.random ?? Math.random;
  const groups = chunkImages(shuffleArray(imagePaths, random), groupSize);
  if (groups.length === 0) {
    return contentSlides;
  }

  const slides: DisplaySlide[] = [];
  let galleryIndex = 0;
  for (const slide of contentSlides) {
    slides.push({
      kind: 'gallery',
      images: groups[galleryIndex % groups.length],
    });
    galleryIndex += 1;
    slides.push(slide);
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
      athleteNames: athleteNamesForTeam(team),
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
      const wodBreakdown = team.scores
        .filter((score) => score.verified)
        .sort((a, b) => a.wod_number - b.wod_number)
        .map(
          (score) =>
            `W${score.wod_number} #${score.wod_rank ?? '—'} (${score.wod_points ?? 0})`
        )
        .join(' · ');
      return {
        teamId: team.id,
        teamName: team.team_name,
        athleteNames: athleteNamesForTeam(team),
        rank: team.overall_rank ?? null,
        status: 'verified' as const,
        scoreLabel: wodBreakdown,
        pointsLabel: `${points} pts`,
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
      athleteNames: athleteNamesForTeam(team),
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

export interface FlagDrivenSlidesOptions {
  categories: string[];
  teams: apiTeamsOutputDetailModel[];
  heatsPayload: HeatsPayload | null | undefined;
  display: HeatsDisplayConfig;
  imagePaths: string[];
  groupSize?: number;
  random?: () => number;
}

/**
 * TV rotation driven only by display flags.
 * Leaderboard slides are omitted when the category has no verified data.
 */
export function buildFlagDrivenSlides(
  options: FlagDrivenSlidesOptions
): DisplaySlide[] {
  const {
    categories,
    teams,
    heatsPayload,
    imagePaths,
    groupSize = 4,
  } = options;
  const config = normalizeHeatsDisplayConfig(options.display);
  const random = options.random ?? Math.random;
  const slides: DisplaySlide[] = [];

  if (config.pics && imagePaths.length > 0) {
    // One random group per rebuild; display bumps previewEpoch whenever
    // this slide is shown so photos reshuffle every rotation through Pics.
    const groups = chunkImages(shuffleArray(imagePaths, random), groupSize);
    if (groups.length > 0) {
      slides.push({ kind: 'gallery', images: groups[0] });
    }
  }

  const descFlags: Array<[number, boolean]> = [
    [1, config.wodDesc1],
    [2, config.wodDesc2],
    [3, config.wodDesc3],
    [4, config.wodDesc4],
    [5, config.wodDesc5],
  ];
  for (const [wodNumber, enabled] of descFlags) {
    if (enabled) {
      slides.push({ kind: 'wodInfo', wodNumber });
    }
  }

  slides.push(...buildHeatsSlides(heatsPayload, config));

  const leaderboardWods: Array<[number, boolean]> = [
    [1, config.leaderboardWod1],
    [2, config.leaderboardWod2],
    [3, config.leaderboardWod3],
    [4, config.leaderboardWod4],
    [5, config.leaderboardWod5],
  ];
  for (const category of categories) {
    for (const [wodNumber, enabled] of leaderboardWods) {
      if (enabled && categoryHasVerifiedWodData(category, wodNumber, teams)) {
        slides.push({
          kind: 'standings',
          category,
          view: { kind: 'wod', wodNumber },
        });
      }
    }
    if (config.leaderboardOverall && categoryHasOverallData(category, teams)) {
      slides.push({
        kind: 'standings',
        category,
        view: { kind: 'overall' },
      });
    }
  }

  return slides;
}
