import { apiScoreOutputModel } from 'src/app/api/models/api-score-output-model';
import { apiTeamsOutputDetailModel } from 'src/app/api/models/api-teams-output-detail-model';
import {
  buildIdleSlides,
  buildLiveRows,
  buildLiveSlides,
  buildPreviewSlides,
  chunkImages,
  findActiveWod,
  formatScoreLabel,
  hasAnyScoreData,
  isWodActive,
  isWodComplete,
} from './display-logic';

function score(
  partial: Partial<apiScoreOutputModel> & {
    wod_number: number;
    verified: boolean;
  }
): apiScoreOutputModel {
  return {
    id: partial.id ?? `s-${partial.wod_number}-${partial.verified}`,
    team_id: partial.team_id ?? 't1',
    wod_number: partial.wod_number,
    verified: partial.verified,
    reps: partial.reps ?? null,
    time_s: partial.time_s ?? null,
    tiebreak_s: partial.tiebreak_s ?? null,
    wod_rank: partial.wod_rank ?? null,
    wod_points: partial.wod_points ?? null,
    score_detail: partial.score_detail ?? null,
  };
}

function team(
  partial: Partial<apiTeamsOutputDetailModel> & {
    id: string;
    team_name: string;
    category: string;
  }
): apiTeamsOutputDetailModel {
  return {
    id: partial.id,
    team_name: partial.team_name,
    category: partial.category,
    event_short_name: partial.event_short_name ?? 'dtteams2026',
    paid: partial.paid ?? true,
    verified: partial.verified ?? true,
    overall_rank: partial.overall_rank ?? null,
    athletes: partial.athletes ?? [],
    scores: partial.scores ?? [],
  };
}

describe('display-logic', () => {
  const openA = team({
    id: 'a',
    team_name: 'Alpha',
    category: 'Open',
    overall_rank: 1,
    scores: [
      score({
        wod_number: 1,
        verified: true,
        reps: 100,
        wod_rank: 1,
        wod_points: 10,
      }),
    ],
  });
  const openB = team({
    id: 'b',
    team_name: 'Bravo',
    category: 'Open',
    overall_rank: 2,
    scores: [
      score({
        wod_number: 1,
        verified: true,
        reps: 90,
        wod_rank: 2,
        wod_points: 8,
      }),
    ],
  });

  describe('isWodComplete / isWodActive / findActiveWod', () => {
    it('treats a WOD with no scores as inactive and incomplete', () => {
      const teams = [openA, openB].map((t) => ({ ...t, scores: [] }));
      expect(isWodComplete(1, teams)).toBe(false);
      expect(isWodActive(1, teams)).toBe(false);
      expect(findActiveWod([1, 2], teams)).toBeNull();
      expect(hasAnyScoreData(teams)).toBe(false);
    });

    it('marks a WOD active when some scores exist but not all verified', () => {
      const teams = [
        openA,
        team({
          id: 'b',
          team_name: 'Bravo',
          category: 'Open',
          scores: [score({ wod_number: 1, verified: false, reps: 80 })],
        }),
      ];
      expect(isWodActive(1, teams)).toBe(true);
      expect(isWodComplete(1, teams)).toBe(false);
      expect(findActiveWod([1, 2], teams)).toBe(1);
      expect(hasAnyScoreData(teams)).toBe(true);
    });

    it('picks the highest active WOD number', () => {
      const teams = [
        team({
          id: 'a',
          team_name: 'Alpha',
          category: 'Open',
          scores: [
            score({
              wod_number: 1,
              verified: true,
              wod_rank: 1,
              wod_points: 10,
            }),
            score({ wod_number: 2, verified: false, time_s: 120 }),
          ],
        }),
        team({
          id: 'b',
          team_name: 'Bravo',
          category: 'Open',
          scores: [
            score({
              wod_number: 1,
              verified: true,
              wod_rank: 2,
              wod_points: 8,
            }),
          ],
        }),
      ];
      expect(isWodComplete(1, teams)).toBe(true);
      expect(isWodActive(1, teams)).toBe(false);
      expect(isWodActive(2, teams)).toBe(true);
      expect(findActiveWod([1, 2], teams)).toBe(2);
    });

    it('marks complete when every verified team has a verified score', () => {
      expect(isWodComplete(1, [openA, openB])).toBe(true);
      expect(isWodActive(1, [openA, openB])).toBe(false);
    });

    it('ignores unverified teams when judging completion', () => {
      const unverified = team({
        id: 'u',
        team_name: 'Unverified',
        category: 'Open',
        verified: false,
        scores: [],
      });
      expect(isWodComplete(1, [openA, openB, unverified])).toBe(true);
    });
  });

  describe('buildIdleSlides / buildLiveSlides', () => {
    it('builds overall then complete WODs only for categories with data', () => {
      const slides = buildIdleSlides(['Open', 'Scaled'], [1, 2], [openA, openB]);
      expect(slides).toEqual([
        {
          kind: 'standings',
          category: 'Open',
          view: { kind: 'overall' },
        },
        {
          kind: 'standings',
          category: 'Open',
          view: { kind: 'wod', wodNumber: 1 },
        },
      ]);
    });

    it('skips idle slides for categories with no scores', () => {
      const scaledOnly = team({
        id: 's',
        team_name: 'Scaled Squad',
        category: 'Scaled',
        verified: true,
        scores: [],
      });
      expect(buildIdleSlides(['Open', 'Scaled'], [1], [scaledOnly])).toEqual(
        []
      );
    });

    it('builds live active WOD then Overall per category with data', () => {
      const teams = [
        team({
          id: 'a',
          team_name: 'Alpha',
          category: 'Open',
          overall_rank: 1,
          scores: [
            score({
              wod_number: 1,
              verified: true,
              wod_rank: 1,
              wod_points: 10,
            }),
            score({ wod_number: 2, verified: false, time_s: 120 }),
          ],
        }),
        team({
          id: 'b',
          team_name: 'Bravo',
          category: 'Open',
          overall_rank: 2,
          scores: [
            score({
              wod_number: 1,
              verified: true,
              wod_rank: 2,
              wod_points: 8,
            }),
          ],
        }),
      ];
      expect(buildLiveSlides(['Open', 'Scaled'], 2, teams)).toEqual([
        {
          kind: 'standings',
          category: 'Open',
          view: { kind: 'wod', wodNumber: 2 },
        },
        {
          kind: 'standings',
          category: 'Open',
          view: { kind: 'overall' },
        },
      ]);
    });

    it('omits live Overall when category has no verified scores yet', () => {
      const teams = [
        team({
          id: 'a',
          team_name: 'Alpha',
          category: 'Open',
          scores: [score({ wod_number: 1, verified: false, reps: 50 })],
        }),
      ];
      expect(buildLiveSlides(['Open'], 1, teams)).toEqual([
        {
          kind: 'standings',
          category: 'Open',
          view: { kind: 'wod', wodNumber: 1 },
        },
      ]);
    });
  });

  describe('buildPreviewSlides', () => {
    it('alternates gallery groups with one page per WOD', () => {
      const paths = ['a.jpg', 'b.jpg', 'c.jpg', 'd.jpg', 'e.jpg'];
      // Keep original order: always pick j === i in Fisher–Yates.
      const random = () => 0.999;
      const slides = buildPreviewSlides([1, 2], paths, {
        groupSize: 4,
        random,
      });
      expect(slides.map((s) => s.kind)).toEqual([
        'gallery',
        'wodInfo',
        'gallery',
        'wodInfo',
      ]);
      expect(slides[0]).toEqual({
        kind: 'gallery',
        images: ['a.jpg', 'b.jpg', 'c.jpg', 'd.jpg'],
      });
      expect(slides[1]).toEqual({ kind: 'wodInfo', wodNumber: 1 });
      expect(slides[2]).toEqual({ kind: 'gallery', images: ['e.jpg'] });
      expect(slides[3]).toEqual({ kind: 'wodInfo', wodNumber: 2 });
    });

    it('still shows WOD pages when there are no gallery images', () => {
      expect(buildPreviewSlides([1, 2], [])).toEqual([
        { kind: 'wodInfo', wodNumber: 1 },
        { kind: 'wodInfo', wodNumber: 2 },
      ]);
    });
  });

  describe('chunkImages', () => {
    it('groups images with a max of 4', () => {
      expect(chunkImages(['1', '2', '3', '4', '5'], 4)).toEqual([
        ['1', '2', '3', '4'],
        ['5'],
      ]);
    });
  });

  describe('buildLiveRows', () => {
    it('includes only verified scores ranked by wod_rank', () => {
      const teams = [
        team({
          id: 'await',
          team_name: 'Zebra',
          category: 'Open',
          scores: [],
        }),
        team({
          id: 'pending',
          team_name: 'Mike',
          category: 'Open',
          scores: [score({ wod_number: 1, verified: false, reps: 50 })],
        }),
        team({
          id: 'verified',
          team_name: 'Alpha',
          category: 'Open',
          scores: [
            score({
              wod_number: 1,
              verified: true,
              reps: 100,
              wod_rank: 1,
              wod_points: 10,
            }),
          ],
        }),
      ];
      const rows = buildLiveRows(teams, 'Open', 1);
      expect(rows.map((r) => r.status)).toEqual(['verified']);
      expect(rows.map((r) => r.teamId)).toEqual(['verified']);
      expect(rows[0].rank).toBe(1);
      expect(rows[0].scoreLabel).toBe('100');
    });
  });

  describe('formatScoreLabel', () => {
    it('formats reps, time, and tiebreak', () => {
      expect(
        formatScoreLabel(
          score({
            wod_number: 1,
            verified: true,
            reps: 40,
            time_s: 125,
            tiebreak_s: 10,
          })
        )
      ).toBe('40 · 2:05 · TB 0:10');
    });
  });
});
