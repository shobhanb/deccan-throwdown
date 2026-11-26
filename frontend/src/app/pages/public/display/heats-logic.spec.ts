import {
  buildHeatsSlides,
  mergeWodBlocks,
  normalizeHeatsDisplayConfig,
  normalizeHeatsPayload,
  resolveHeatsKey,
  splitHeatsColumns,
} from './heats-logic';
import { HeatsDisplayConfig, HeatsPayload } from './heats-types';

function samplePayload(): HeatsPayload {
  return {
    blocks: [
      {
        wodNumber: 1,
        wodLabel: 'WOD1',
        division: 'Scaled',
        heats: [{ entries: [{ teamName: 'S1', judge: 'J1' }] }],
      },
      {
        wodNumber: 1,
        wodLabel: 'WOD1',
        division: 'Open',
        heats: [{ entries: [{ teamName: 'O1', judge: 'J2' }] }],
      },
      {
        wodNumber: 4,
        wodLabel: 'T-T-M-M Yoke Carry',
        division: 'Scaled',
        heats: [{ entries: [{ teamName: 'S4', judge: 'J4' }] }],
      },
      {
        wodNumber: 4,
        wodLabel: 'T-T-M-M Double-Unders',
        division: 'Open',
        heats: [{ entries: [{ teamName: 'O4', judge: 'J5' }] }],
      },
      {
        wodNumber: 4,
        wodLabel: 'T-T-M-M Support Hold',
        division: 'Scaled',
        heats: [{ entries: [{ teamName: 'S4h', judge: 'J6' }] }],
      },
    ],
  };
}

function display(
  partial: Partial<HeatsDisplayConfig> = {}
): HeatsDisplayConfig {
  return normalizeHeatsDisplayConfig({
    ...partial,
  });
}

describe('heats-logic', () => {
  describe('normalizeHeatsPayload', () => {
    it('flattens legacy days into blocks', () => {
      const normalized = normalizeHeatsPayload({
        days: [
          {
            day: 1,
            date: '2026-11-28',
            blocks: [
              {
                wodNumber: 1,
                wodLabel: 'WOD1',
                division: 'Open',
                heatsKey: '1',
                heats: [
                  {
                    heatNumber: 1,
                    entries: [{ teamName: 'A' }],
                  },
                ],
              },
            ],
          },
        ],
      } as unknown as HeatsPayload);
      expect(normalized.blocks).toEqual([
        {
          wodNumber: 1,
          wodLabel: 'WOD1',
          division: 'Open',
          heats: [{ entries: [{ teamName: 'A' }] }],
        },
      ]);
    });
  });

  describe('resolveHeatsKey', () => {
    it('infers 4-ttmm / 4-rope / 4-hold from labels', () => {
      expect(
        resolveHeatsKey({
          wodNumber: 4,
          wodLabel: 'T-T-M-M Yoke Carry',
          division: 'Scaled',
          heats: [],
        })
      ).toBe('4-ttmm');
      expect(
        resolveHeatsKey({
          wodNumber: 4,
          wodLabel: 'T-T-M-M Single-Unders',
          division: 'Scaled',
          heats: [],
        })
      ).toBe('4-rope');
      expect(
        resolveHeatsKey({
          wodNumber: 4,
          wodLabel: 'T-T-M-M Tuck Hold',
          division: 'Open',
          heats: [],
        })
      ).toBe('4-hold');
    });
  });

  describe('buildHeatsSlides', () => {
    it('only includes enabled heats keys and numbers heats by order', () => {
      const slides = buildHeatsSlides(
        samplePayload(),
        display({ heatsWod1: true, heatsWod4Rope: true })
      );
      expect(slides.map((s) => s.heatsKey)).toEqual(['1', '4-rope']);
      expect(slides[0].sections.map((s) => s.division)).toEqual([
        'Scaled',
        'Open',
      ]);
      expect(slides[0].sections[0].heats[0].heatNumber).toBe(1);
    });

    it('splits TTMM heats into one slide per division', () => {
      const slides = buildHeatsSlides(
        {
          blocks: [
            {
              wodNumber: 4,
              wodLabel: 'T-T-M-M Single-Unders',
              division: 'Scaled',
              heats: [{ entries: [{ teamName: 'S' }] }],
            },
            {
              wodNumber: 4,
              wodLabel: 'T-T-M-M Double-Unders',
              division: 'Open',
              heats: [{ entries: [{ teamName: 'O' }] }],
            },
          ],
        },
        display({ heatsWod4Rope: true })
      );
      expect(slides.map((s) => s.heatsKey)).toEqual(['4-rope', '4-rope']);
      expect(slides.map((s) => s.sections.map((sec) => sec.division))).toEqual([
        ['Scaled'],
        ['Open'],
      ]);
      expect(slides.map((s) => s.wodLabel)).toEqual([
        'T-T-M-M Single-Unders',
        'T-T-M-M Double-Unders',
      ]);
    });

    it('returns nothing when heats flags are off', () => {
      expect(buildHeatsSlides(samplePayload(), display())).toEqual([]);
    });
  });

  describe('splitHeatsColumns', () => {
    it('puts the first half on the left and the rest on the right', () => {
      expect(splitHeatsColumns([1, 2, 3])).toEqual([[1, 2], [3]]);
      expect(splitHeatsColumns([1, 2, 3, 4])).toEqual([
        [1, 2],
        [3, 4],
      ]);
    });
  });

  describe('mergeWodBlocks', () => {
    it('replaces only the selected wod blocks', () => {
      const merged = mergeWodBlocks(samplePayload(), 1, [
        {
          wodNumber: 1,
          wodLabel: 'WOD1 updated',
          division: 'Open',
          heats: [{ entries: [{ teamName: 'New' }] }],
        },
      ]);
      expect(merged.blocks.filter((b) => b.wodNumber === 1)).toEqual([
        {
          wodNumber: 1,
          wodLabel: 'WOD1 updated',
          division: 'Open',
          heats: [{ entries: [{ teamName: 'New' }] }],
        },
      ]);
      expect(merged.blocks.filter((b) => b.wodNumber === 4)).toHaveSize(3);
    });
  });
});
