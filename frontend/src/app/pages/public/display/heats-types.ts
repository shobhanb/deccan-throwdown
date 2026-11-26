/** Shape of the remote heats schedule JSON (payload). */

export interface HeatsEntry {
  teamName: string;
  judge?: string;
}

/** Stored heat — heat number is array index + 1 at display time. */
export interface HeatsHeat {
  startTime?: string;
  entries: HeatsEntry[];
}

export interface HeatsHeatView extends HeatsHeat {
  heatNumber: number;
}

/** Stable key for heats display toggles (WOD 4 is split by TTMM station). */
export type HeatsKey =
  | '1'
  | '2'
  | '3'
  | '4-ttmm'
  | '4-rope'
  | '4-hold'
  | '5';

export interface HeatsBlock {
  wodNumber: number;
  wodLabel: string;
  division: string;
  heats: HeatsHeat[];
}

/** TV board switches — first-class API fields on the heats document. */
export interface HeatsDisplayConfig {
  pics: boolean;

  wodDesc1: boolean;
  wodDesc2: boolean;
  wodDesc3: boolean;
  wodDesc4: boolean;
  wodDesc5: boolean;

  heatsWod1: boolean;
  heatsWod2: boolean;
  heatsWod3: boolean;
  heatsWod4Ttmm: boolean;
  heatsWod4Rope: boolean;
  heatsWod4Hold: boolean;
  heatsWod5: boolean;

  leaderboardWod1: boolean;
  leaderboardWod2: boolean;
  leaderboardWod3: boolean;
  leaderboardWod4: boolean;
  leaderboardWod5: boolean;
  leaderboardOverall: boolean;

  /** When false, /display heats slides omit the Judge column. */
  showJudges: boolean;

  rotateSeconds: number;
}

export interface HeatsPayload {
  blocks: HeatsBlock[];
}

/** Admin editor: full schedule or one WOD's blocks. */
export interface HeatsPartialPayload {
  wodNumber: number;
  blocks: HeatsBlock[];
}

export interface HeatsDocument {
  event_short_name: string;
  payload: HeatsPayload;
  display: HeatsDisplayConfig;
  updated_at?: string | null;
}
