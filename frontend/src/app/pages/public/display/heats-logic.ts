import {
  HeatsBlock,
  HeatsDisplayConfig,
  HeatsHeat,
  HeatsHeatView,
  HeatsKey,
  HeatsPayload,
  HeatsPartialPayload,
} from './heats-types';

export type HeatsSlideSection = {
  division: string;
  wodLabel: string;
  heats: HeatsHeatView[];
};

/**
 * One slide = one heats key.
 * WOD 4 (TTMM) stations are split one division per slide to avoid overflow.
 */
export type HeatsSlideRef = {
  kind: 'heats';
  wodNumber: number;
  wodLabel: string;
  heatsKey: HeatsKey;
  sections: HeatsSlideSection[];
};

const DEFAULT_ROTATE_SECONDS = 12;
const MIN_ROTATE_SECONDS = 3;
const MAX_ROTATE_SECONDS = 120;

const HEATS_KEY_ORDER: HeatsKey[] = [
  '1',
  '2',
  '3',
  '4-ttmm',
  '4-rope',
  '4-hold',
  '5',
];

export function clampRotateSeconds(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_ROTATE_SECONDS;
  }
  return Math.min(
    MAX_ROTATE_SECONDS,
    Math.max(MIN_ROTATE_SECONDS, Math.round(value))
  );
}

export function defaultHeatsDisplayConfig(): HeatsDisplayConfig {
  return {
    pics: true,
    wodDesc1: true,
    wodDesc2: true,
    wodDesc3: true,
    wodDesc4: true,
    wodDesc5: true,
    heatsWod1: false,
    heatsWod2: false,
    heatsWod3: false,
    heatsWod4Ttmm: false,
    heatsWod4Rope: false,
    heatsWod4Hold: false,
    heatsWod5: false,
    leaderboardWod1: false,
    leaderboardWod2: false,
    leaderboardWod3: false,
    leaderboardWod4: false,
    leaderboardWod5: false,
    leaderboardOverall: false,
    showJudges: false,
    rotateSeconds: DEFAULT_ROTATE_SECONDS,
  };
}

/** Normalize API (snake_case) or app (camelCase) display config. */
export function normalizeHeatsDisplayConfig(
  raw?: Partial<HeatsDisplayConfig> | Record<string, unknown> | null
): HeatsDisplayConfig {
  const defaults = defaultHeatsDisplayConfig();
  if (!raw) {
    return defaults;
  }
  const r = raw as Record<string, unknown>;

  const bool = (...keys: string[]): boolean | undefined => {
    for (const key of keys) {
      if (key in r) {
        return r[key] !== false && r[key] !== 0 && r[key] !== 'false';
      }
    }
    return undefined;
  };

  const rotateRaw = r['rotateSeconds'] ?? r['rotate_seconds'];
  return {
    pics: bool('pics') ?? defaults.pics,
    wodDesc1: bool('wodDesc1', 'wod_desc_1') ?? defaults.wodDesc1,
    wodDesc2: bool('wodDesc2', 'wod_desc_2') ?? defaults.wodDesc2,
    wodDesc3: bool('wodDesc3', 'wod_desc_3') ?? defaults.wodDesc3,
    wodDesc4: bool('wodDesc4', 'wod_desc_4') ?? defaults.wodDesc4,
    wodDesc5: bool('wodDesc5', 'wod_desc_5') ?? defaults.wodDesc5,
    heatsWod1: bool('heatsWod1', 'heats_wod_1') ?? defaults.heatsWod1,
    heatsWod2: bool('heatsWod2', 'heats_wod_2') ?? defaults.heatsWod2,
    heatsWod3: bool('heatsWod3', 'heats_wod_3') ?? defaults.heatsWod3,
    heatsWod4Ttmm:
      bool('heatsWod4Ttmm', 'heats_wod_4_ttmm') ?? defaults.heatsWod4Ttmm,
    heatsWod4Rope:
      bool('heatsWod4Rope', 'heats_wod_4_rope') ?? defaults.heatsWod4Rope,
    heatsWod4Hold:
      bool('heatsWod4Hold', 'heats_wod_4_hold') ?? defaults.heatsWod4Hold,
    heatsWod5: bool('heatsWod5', 'heats_wod_5') ?? defaults.heatsWod5,
    leaderboardWod1:
      bool('leaderboardWod1', 'leaderboard_wod_1') ?? defaults.leaderboardWod1,
    leaderboardWod2:
      bool('leaderboardWod2', 'leaderboard_wod_2') ?? defaults.leaderboardWod2,
    leaderboardWod3:
      bool('leaderboardWod3', 'leaderboard_wod_3') ?? defaults.leaderboardWod3,
    leaderboardWod4:
      bool('leaderboardWod4', 'leaderboard_wod_4') ?? defaults.leaderboardWod4,
    leaderboardWod5:
      bool('leaderboardWod5', 'leaderboard_wod_5') ?? defaults.leaderboardWod5,
    leaderboardOverall:
      bool('leaderboardOverall', 'leaderboard_overall') ??
      defaults.leaderboardOverall,
    showJudges: bool('showJudges', 'show_judges') ?? defaults.showJudges,
    rotateSeconds: clampRotateSeconds(
      typeof rotateRaw === 'number' ? rotateRaw : DEFAULT_ROTATE_SECONDS
    ),
  };
}

export function cleanHeat(heat: HeatsHeat): HeatsHeat {
  const out: HeatsHeat = {
    entries: heat.entries ?? [],
  };
  if (heat.startTime) {
    out.startTime = heat.startTime;
  }
  return out;
}

export function cleanBlock(block: HeatsBlock): HeatsBlock {
  return {
    wodNumber: block.wodNumber,
    wodLabel: block.wodLabel,
    division: block.division,
    heats: (block.heats ?? []).map(cleanHeat),
  };
}

/** Flatten legacy `{ days: [{ blocks }] }` or accept `{ blocks }`. */
export function normalizeHeatsPayload(
  raw?: HeatsPayload | Record<string, unknown> | null
): HeatsPayload {
  if (!raw || typeof raw !== 'object') {
    return { blocks: [] };
  }
  const r = raw as Record<string, unknown>;
  let rawBlocks: unknown[] = [];
  if (Array.isArray(r['blocks'])) {
    rawBlocks = r['blocks'] as unknown[];
  } else if (Array.isArray(r['days'])) {
    for (const day of r['days'] as unknown[]) {
      if (day && typeof day === 'object') {
        const blocks = (day as { blocks?: unknown }).blocks;
        if (Array.isArray(blocks)) {
          rawBlocks.push(...blocks);
        }
      }
    }
  }
  return {
    blocks: rawBlocks
      .filter((b): b is HeatsBlock => !!b && typeof b === 'object')
      .map((b) => cleanBlock(b as HeatsBlock)),
  };
}

export function scheduleForEditor(payload: HeatsPayload): HeatsPayload {
  return normalizeHeatsPayload(payload);
}

export function partialForEditor(
  payload: HeatsPayload,
  wodNumber: number
): HeatsPartialPayload {
  const full = normalizeHeatsPayload(payload);
  return {
    wodNumber,
    blocks: full.blocks.filter((b) => b.wodNumber === wodNumber),
  };
}

/** Replace all blocks for `wodNumber` while preserving order of other WODs. */
export function mergeWodBlocks(
  full: HeatsPayload,
  wodNumber: number,
  wodBlocks: HeatsBlock[]
): HeatsPayload {
  const base = normalizeHeatsPayload(full);
  const incoming = wodBlocks.map((b) =>
    cleanBlock({ ...b, wodNumber })
  );
  const result: HeatsBlock[] = [];
  let inserted = false;
  for (const block of base.blocks) {
    if (block.wodNumber === wodNumber) {
      if (!inserted) {
        result.push(...incoming);
        inserted = true;
      }
    } else {
      result.push(block);
    }
  }
  if (!inserted) {
    result.push(...incoming);
  }
  return { blocks: result };
}

export function heatsWithNumbers(heats: HeatsHeat[]): HeatsHeatView[] {
  return (heats ?? []).map((heat, index) => ({
    ...heat,
    heatNumber: index + 1,
  }));
}

export function resolveHeatsKey(block: HeatsBlock): HeatsKey | null {
  const label = (block.wodLabel ?? '').toLowerCase();
  if (block.wodNumber === 4) {
    if (label.includes('yoke')) {
      return '4-ttmm';
    }
    if (label.includes('under')) {
      return '4-rope';
    }
    if (label.includes('hold')) {
      return '4-hold';
    }
    return '4-ttmm';
  }
  if (
    block.wodNumber === 1 ||
    block.wodNumber === 2 ||
    block.wodNumber === 3 ||
    block.wodNumber === 5
  ) {
    return String(block.wodNumber) as HeatsKey;
  }
  return null;
}

function heatsFlagForKey(
  config: HeatsDisplayConfig,
  key: HeatsKey
): boolean {
  switch (key) {
    case '1':
      return config.heatsWod1;
    case '2':
      return config.heatsWod2;
    case '3':
      return config.heatsWod3;
    case '4-ttmm':
      return config.heatsWod4Ttmm;
    case '4-rope':
      return config.heatsWod4Rope;
    case '4-hold':
      return config.heatsWod4Hold;
    case '5':
      return config.heatsWod5;
  }
}

function wodNumberForHeatsKey(key: HeatsKey): number {
  if (key.startsWith('4')) {
    return 4;
  }
  return Number(key);
}

function primaryWodLabel(blocks: HeatsBlock[]): string {
  const labels = [...new Set(blocks.map((b) => b.wodLabel).filter(Boolean))];
  if (labels.length === 0) {
    return '';
  }
  if (labels.length === 1) {
    return labels[0];
  }
  const first = labels[0];
  const colon = first.indexOf(':');
  if (colon > 0 && labels.every((l) => l.startsWith(first.slice(0, colon)))) {
    return first.slice(0, colon).trim();
  }
  if (labels.every((l) => l.startsWith('T-T-M-M'))) {
    return 'T-T-M-M';
  }
  return labels.join(' / ');
}

export function isTtmmHeatsKey(key: HeatsKey): boolean {
  return key.startsWith('4');
}

/** Split heats into left / right columns (first half, second half). */
export function splitHeatsColumns<T>(heats: T[]): [T[], T[]] {
  if (heats.length <= 1) {
    return [heats, []];
  }
  const mid = Math.ceil(heats.length / 2);
  return [heats.slice(0, mid), heats.slice(mid)];
}

function sectionFromBlock(block: HeatsBlock): HeatsSlideSection {
  return {
    division: block.division,
    wodLabel: block.wodLabel,
    heats: heatsWithNumbers(block.heats),
  };
}

/** Build heats slides for explicitly enabled heats keys only. */
export function buildHeatsSlides(
  payload: HeatsPayload | null | undefined,
  display?: Partial<HeatsDisplayConfig> | null
): HeatsSlideRef[] {
  const config = normalizeHeatsDisplayConfig(display);
  const blocks = normalizeHeatsPayload(payload).blocks;
  const slides: HeatsSlideRef[] = [];

  for (const key of HEATS_KEY_ORDER) {
    if (!heatsFlagForKey(config, key)) {
      continue;
    }
    const matched = blocks.filter((block) => resolveHeatsKey(block) === key);
    if (matched.length === 0) {
      continue;
    }

    // TTMM stations put Open + Scaled on separate pages (too tall together).
    if (isTtmmHeatsKey(key) && matched.length > 1) {
      for (const block of matched) {
        slides.push({
          kind: 'heats',
          wodNumber: wodNumberForHeatsKey(key),
          wodLabel: block.wodLabel || primaryWodLabel([block]),
          heatsKey: key,
          sections: [sectionFromBlock(block)],
        });
      }
      continue;
    }

    slides.push({
      kind: 'heats',
      wodNumber: wodNumberForHeatsKey(key),
      wodLabel: primaryWodLabel(matched),
      heatsKey: key,
      sections: matched.map(sectionFromBlock),
    });
  }

  return slides;
}
