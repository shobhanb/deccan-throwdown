type ScoreType = 'Reps' | 'Weight' | 'Time' | 'Tiebreak';

export interface AppConfig {
  eventName: string;
  categories: string[];
  athletesPerTeam: number;
  wods: WodConfig[];
  standardsUrl?: string;
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
    standardsUrl: 'assets/standards/dtpairs2025-standards.pdf',
  },
  dtteams2025: {
    eventName: 'Deccan Throwdown Teams 2025',
    categories: ['Beginner', 'Intermediate', 'Advanced'],
    athletesPerTeam: 4,
    wods: [
      {
        wodNumber: 1,
        wodName: 'Do you even squat?',
        wodSummary: 'Lots of Squats for time',
        wodDescription: [
          'For Time:',
          'Beginner: Front Squats',
          'Intermediate: Overhead squats',
          'Advanced: Heavy Overhead Squats',
          'Time cap 5 mins',
        ],
        scoreTypes: ['Reps', 'Time', 'Tiebreak'],
      },
      {
        wodNumber: 2,
        wodName: 'Beam me up Scotty',
        wodSummary: 'Row, Pull-ups, Bike, Push-ups and rope climbs',
        wodDescription: [
          '15 minutes AMREPS',
          'Row Calories',
          'Pull-ups',
          'Bike Calories',
          'Push-ups',
          'Max Rope Climbs',
        ],
        scoreTypes: ['Reps', 'Tiebreak'],
      },
      {
        wodNumber: 3,
        wodName: 'Sympathy for the Devil',
        wodSummary: 'FT: Devils Press, Shuttle runs and Double Unders',
        wodDescription: [
          'For Time:',
          'Start with & repeat every 3 mins: Shuttle Runs & Double Unders',
          'Synchronised Devils Press',
          'Time Cap 15 mins',
        ],
        scoreTypes: ['Time', 'Reps'],
      },
      {
        wodNumber: 4,
        wodName: 'From the window to the wall',
        wodSummary: 'FT: Wall walks, Box jump overs, Power Cleans',
        wodDescription: [
          'For Time:',
          'Wall Walks',
          'Box Jump Overs',
          'Power Cleans',
        ],
        scoreTypes: ['Time', 'Tiebreak'],
      },
    ],
    // standardsUrl: 'assets/standards/dtpairs2025-standards.pdf',
  },
};

export const defaultConfig = 'dtteams2025';
