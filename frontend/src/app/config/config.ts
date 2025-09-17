type ScoreType = 'Reps' | 'Weight' | 'Time' | 'Tiebreak';

export interface AppConfig {
  eventName: string;
  categories: string[];
  athletesPerTeam: number;
  wods: WodConfig[];
}

export interface WodConfig {
  wodNumber: number;
  wodName: string;
  wodSummary: string;
  wodDescription: string[];
  scoreTypes: ScoreType[];
}

export const appConfig: { [key: string]: AppConfig } = {
  dtpairs2025: {
    eventName: 'Deccan Throwdown Pairs 2025',
    categories: [
      'FF-Beginners',
      'MF-Beginners',
      'MM-Beginners',
      'FF-Open',
      'MF-Open',
      'MM-Open',
    ],
    athletesPerTeam: 2,
    wods: [
      {
        wodNumber: 1,
        wodName: 'Head, Shoulders, Knees & Toes',
        wodSummary: 'AMRAP 15 mins Pullups, Toes-to-bar, Shoulder-to-overheads',
        wodDescription: [
          'Open: 2 Pull-ups, 5 Toes-to-bar, 7 Shoulder-to-overheads  (♀25kg ♂40kg)',
          'Beginner: 4 Jumping Pull-Ups, 5 Hanging Knee Raises, 7 Shoulder-to-Overheads (♀15kg ♂25kg)',
        ],
        scoreTypes: ['Reps'],
      },
      {
        wodNumber: 2,
        wodName: 'काका ! मला वाचवा !',
        wodSummary: 'For Time: 100m Run, 100m Sled Pull, 100m Run',
        wodDescription: [
          'Load on the sled:',
          'Open: ⚢ 30kg ⚤ 40kg ⚣ 50kg',
          'Beginners: ⚢ 20kg ⚤ 30kg ⚣ 40kg',
        ],
        scoreTypes: ['Time'],
      },
      {
        wodNumber: 3,
        wodName: 'Love Boat',
        wodSummary: 'For Time: Dumbbell Lunges, Row, Support Hold',
        wodDescription: [
          'For Time (Time cap 12 mins):',
          '30 Alternating Synchronised Dumbbell Front Rack Lunges',
          'Calorie Row / Support Hold / High Plank',
          '30 Alternating Synchronised Dumbbell Front Rack Lunges',
          'DB weights: Open: ♀ 10kg ♂15kg; Beginners: ♀ 5kg ♂7.5kg',
          'Row cals: Open: ⚢ 50 ⚤ 60 ⚣ 75; Beginners: ⚢ 40 ⚤ 50 ⚣ 60',
          'During row cals: Open: Parallel Bar Support Hold; Beginners: High Plank',
        ],
        scoreTypes: ['Reps', 'Time'],
      },
      {
        wodNumber: 4,
        wodName: 'Heavy Triple',
        wodSummary: '5 mins to establish a Max. 3-Rep Hang Clean',
        wodDescription: [],
        scoreTypes: ['Weight'],
      },
    ],
  },
  dtteams2025: {
    eventName: 'Deccan Throwdown Teams 2025',
    categories: ['Beginner', 'Intermediate', 'Advanced'],
    athletesPerTeam: 4,
    wods: [
      {
        wodNumber: 1,
        wodName: 'Hagne ka time',
        wodSummary: '20 mins to establish a max dump weight',
        wodDescription: [],
        scoreTypes: ['Weight'],
      },
      {
        wodNumber: 2,
        wodName: 'Beer and Burpees',
        wodSummary: 'Drink beer while doing burpees (Time cap 20 mins)',
        wodDescription: [
          '20 beers',
          'Every time you take a sip, do 15 burpees',
        ],
        scoreTypes: ['Reps', 'Time'],
      },
      {
        wodNumber: 3,
        wodName: 'Ok lets WOD also',
        wodSummary: 'Repeat of Crossfit Open 25.2',
        wodDescription: [
          'For Time:',
          '21 pull-ups',
          '42 double-unders',
          '21 thrusters (weight 1)',
          '18 chest-to-bar pull-ups',
          '36 double-unders',
          '18 thrusters (weight 2)',
          '15 bar muscle-ups',
          '30 double-unders',
          '15 thrusters (weight 3)',
          'Time cap: 12 minutes',
          '♀ 65, 75, 85 lb (29, 34, 38 kg)',
          '♂ 95, 115, 135 lb (43, 52, 61 kg)',
        ],
        scoreTypes: ['Reps', 'Time', 'Tiebreak'],
      },
      {
        wodNumber: 4,
        wodName: 'Soneka Time',
        wodSummary: 'Sleep for as long as possible',
        wodDescription: ['Tiebreak is recorded when you actually fall asleep'],
        scoreTypes: ['Time', 'Tiebreak'],
      },
    ],
  },
};

export const defaultConfig = 'dtteams2025';
