import { StationScheme } from 'src/app/config/config';
import {
  buildStationProgress,
  composeAmrapReps,
  decomposeAmrapReps,
  stationDisplayChips,
  stationRepsPerRound,
  stationScoreboardView,
  stationSummaryLines,
} from './stations';

const wod1Open: StationScheme = {
  mode: 'linear',
  stations: [
    { key: 'wall_ball', label: 'Partner Wall-Ball', reps: 150 },
    { key: 'ttb', label: 'Toes-to-Bar', reps: 30 },
    { key: 'pull_ups', label: 'Pull-Ups', reps: 30 },
    { key: 'synchro_ttb', label: 'Synchro Toes-to-Bar', reps: 30 },
    { key: 'synchro_pu', label: 'Synchro Pull-Ups', reps: 30 },
    { key: 'bmu', label: 'Bar Muscle-Ups' },
  ],
};

const wod2Open: StationScheme = {
  mode: 'linear',
  stations: [
    { key: 'bso_1', label: 'Synchro DB Box Step-Overs (MMF1)', reps: 70 },
    { key: 'burpees', label: 'Synchro Bar Facing Burpees', reps: 50 },
    { key: 'bso_2', label: 'Synchro DB Box Step-Overs (MMF2)', reps: 70 },
  ],
};

const wod4Open: StationScheme = {
  mode: 'amrap',
  stations: [
    { key: 'cals', label: 'Cal Row & Air Bike', reps: 140 },
    { key: 'deadlifts', label: 'Synchro DB Deadlifts', reps: 20 },
    { key: 'wall_walks', label: 'Wall Walks', reps: 10 },
  ],
};

const wod5: StationScheme = {
  mode: 'linear',
  stations: [
    { key: 'gto_w1', label: 'GTO Weight 1', reps: 36 },
    { key: 'gto_w2', label: 'GTO Weight 2', reps: 24 },
    { key: 'gto_w3', label: 'GTO Weight 3', reps: 12 },
    { key: 'gto_w4', label: 'GTO Weight 4', reps: 6 },
  ],
};

describe('buildStationProgress', () => {
  it('returns null without reps or scheme', () => {
    expect(buildStationProgress(null, wod1Open)).toBeNull();
    expect(buildStationProgress(10, null)).toBeNull();
  });

  it('walks WOD 1 Open buy-in then max BMU', () => {
    const mid = buildStationProgress(165, wod1Open)!;
    expect(mid.mode).toBe('linear');
    expect(mid.stations.map((s) => [s.key, s.done, s.status])).toEqual([
      ['wall_ball', 150, 'done'],
      ['ttb', 15, 'current'],
      ['pull_ups', 0, 'pending'],
      ['synchro_ttb', 0, 'pending'],
      ['synchro_pu', 0, 'pending'],
      ['bmu', 0, 'pending'],
    ]);

    const max = buildStationProgress(280, wod1Open)!;
    expect(max.stations.find((s) => s.key === 'bmu')).toEqual({
      key: 'bmu',
      label: 'Bar Muscle-Ups',
      done: 10,
      target: null,
      status: 'max',
    });
  });

  it('walks WOD 2 Open capped progress', () => {
    const progress = buildStationProgress(95, wod2Open)!;
    expect(progress.stations.map((s) => [s.key, s.done, s.status])).toEqual([
      ['bso_1', 70, 'done'],
      ['burpees', 25, 'current'],
      ['bso_2', 0, 'pending'],
    ]);
  });

  it('walks WOD 5 ladder', () => {
    const progress = buildStationProgress(60, wod5)!;
    expect(progress.stations.every((s) => s.key.startsWith('gto'))).toBe(true);
    expect(progress.stations[0].status).toBe('done');
    expect(progress.stations[1].status).toBe('done');
    expect(progress.stations[2].status).toBe('pending');
  });

  it('computes WOD 4 AMRAP rounds and partial remainder', () => {
    expect(buildStationProgress(170, wod4Open)).toEqual({
      mode: 'amrap',
      stations: [],
      roundsCompleted: 1,
      hasData: true,
    });

    const partialCals = buildStationProgress(80, wod4Open)!;
    expect(partialCals.roundsCompleted).toBe(0);
    expect(partialCals.stations).toEqual([
      {
        key: 'cals',
        label: 'Cal Row & Air Bike',
        done: 80,
        target: 140,
        status: 'current',
      },
      {
        key: 'deadlifts',
        label: 'Synchro DB Deadlifts',
        done: 0,
        target: 20,
        status: 'pending',
      },
      {
        key: 'wall_walks',
        label: 'Wall Walks',
        done: 0,
        target: 10,
        status: 'pending',
      },
    ]);

    // 2 rounds + 140 cals + 15 deadlifts = 340 + 155 = 495
    const deep = buildStationProgress(495, wod4Open)!;
    expect(deep.roundsCompleted).toBe(2);
    expect(deep.stations.find((s) => s.key === 'cals')?.status).toBe('done');
    expect(deep.stations.find((s) => s.key === 'deadlifts')).toEqual({
      key: 'deadlifts',
      label: 'Synchro DB Deadlifts',
      done: 15,
      target: 20,
      status: 'current',
    });
  });
});

describe('compose / decompose AMRAP reps', () => {
  it('reports reps per round', () => {
    expect(stationRepsPerRound(wod4Open)).toBe(170);
    expect(stationRepsPerRound(wod1Open)).toBe(0);
  });

  it('decomposes and composes round totals', () => {
    expect(decomposeAmrapReps(495, wod4Open)).toEqual({
      rounds: 2,
      partialReps: 155,
    });
    expect(composeAmrapReps(2, 155, wod4Open)).toBe(495);
    expect(composeAmrapReps(1, null, wod4Open)).toBe(170);
    expect(composeAmrapReps(null, 80, wod4Open)).toBe(80);
    expect(composeAmrapReps(null, null, wod4Open)).toBeNull();
  });
});

describe('stationSummaryLines / scoreboard / chips', () => {
  it('formats linear summary', () => {
    expect(stationSummaryLines(95, wod2Open)).toEqual([
      '70 Synchro DB Box Step-Overs (MMF1) · 25/50 Synchro Bar Facing Burpees',
    ]);
  });

  it('formats AMRAP rounds + partial', () => {
    expect(stationSummaryLines(170, wod4Open)).toEqual(['1 round']);
    expect(stationSummaryLines(80, wod4Open)).toEqual([
      '80/140 Cal Row & Air Bike',
    ]);
    expect(stationSummaryLines(495, wod4Open)).toEqual([
      '2 rounds + 140 Cal Row & Air Bike · 15/20 Synchro DB Deadlifts',
    ]);
  });

  it('builds scoreboard view and display chips', () => {
    const view = stationScoreboardView(495, wod4Open)!;
    expect(view.roundsCompleted).toBe(2);
    expect(view.headline).toContain('2 rounds');
    expect(view.stations.map((s) => s.key)).toEqual(['cals', 'deadlifts']);

    expect(stationDisplayChips(495, wod4Open)).toEqual([
      '2 rounds',
      '140 Cal Row & Air Bike',
      '15/20 Synchro DB Deadlifts',
    ]);
  });
});
