type ScoreType = 'Reps' | 'Weight' | 'Time' | 'Tiebreak';

export type EventType = 'teams' | 'pairs';
export type RegistrationStatus = 'open' | 'closed' | 'coming-soon';

export interface AppConfig {
  eventName: string;
  eventType: EventType;
  eventDates: string;
  tagline: string;
  registrationStatus: RegistrationStatus;
  leaderboardEnabled: boolean;
  categories: string[];
  athletesPerTeam: number;
  femaleAthletesPerTeam?: number;
  maleAthletesPerTeam?: number;
  /** When set, a team needs this many female athletes and may fill the rest with either sex. */
  minFemaleAthletesPerTeam?: number;
  wods: WodConfig[];
  wodsUrl?: string;
  standardsUrl?: string;
  registrationPricing?: {
    standard: number;
    earlyBird?: number;
    earlyBirdDeadline?: string;
  };
}

export interface WodConfig {
  wodNumber: number;
  wodName: string;
  wodSummary: string;
  wodDescription?: string[];
  categoryWodDescription?: Record<string, string[]>;
  scoreTypes: ScoreType[];
}

export const appConfig: { [key: string]: AppConfig } = {
  dtpairs2025: {
    eventName: 'Deccan Throwdown Pairs 2025',
    eventType: 'pairs',
    eventDates: 'Jan 18th & 19th, 2025',
    tagline: 'Same-sex pairs competing across Beginner and Open divisions.',
    registrationStatus: 'closed',
    leaderboardEnabled: true,
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
    eventType: 'teams',
    eventDates: 'Nov 1st & 2nd, 2025',
    tagline:
      'Teams of 4 athletes (2 female, 2 male). Categories: Beginner, Intermediate, Open.',
    registrationStatus: 'closed',
    leaderboardEnabled: true,
    categories: ['Open', 'Intermediate', 'Beginner'],
    athletesPerTeam: 4,
    wods: [
      {
        wodNumber: 1,
        wodName: "Drop it like it's hot",
        wodSummary: 'Lots of Squats for time',
        categoryWodDescription: {
          Open: [
            'For Time in F/F and M/M pairs:',
            '30 Overhead Squats @ weight 1',
            '20 Overhead Squats @ weight 2',
            '10 Overhead Squats @ weight 3',
            '♀ 25/35/45 kg & ♂ 40/50/60 kg',
            'Time Cap: 5 mins',
            '',
            'Score is Time taken by both pairs to complete the workout OR Total Repetitions completed for both pairs at time cap',
            'If only one pair completes the workout, their completion time will be recorded as tie break',
            '',
            '* Both pairs will be working at the same time but independently and DO NOT need to be in sync',
            '* Both pairs can switch the working athlete at any time and there is no minimum work requirement for any team mate',
            '* Teammates can help in changing the weights on the barbell',
          ],
          Intermediate: [
            'For Time in F/F and M/M pairs:',
            '30 Overhead Squats @ weight 1',
            '20 Overhead Squats @ weight 2',
            '10 Overhead Squats @ weight 3',
            '♀ 20/25/30 kg & ♂ 30/40/50 kg',
            'Time Cap: 5 mins',
            '',
            'Score is Time taken by both pairs to complete the workout OR Total Repetitions completed for both pairs at time cap',
            'If only one pair completes the workout, their completion time will be recorded as tie break',
            '',
            '* Both pairs will be working at the same time but independently and DO NOT need to be in sync',
            '* Both pairs can switch the working athlete at any time and there is no minimum work requirement for any team mate',
            '* Teammates can help in changing the weights on the barbell',
          ],
          Beginner: [
            'For Time in F/F and M/M pairs:',
            '30 Front Squats @ weight 1',
            '20 Front Squats @ weight 2',
            '10 Front Squats @ weight 3',
            '♀ 15/20/25 kg & ♂ 20/30/40 kg',
            'Time Cap: 5 mins',
            '',
            'Score is Time taken by both pairs to complete the workout OR Total Repetitions completed for both pairs at time cap',
            'If only one pair completes the workout, their completion time will be recorded as tie break',
            '',
            '* Both pairs will be working at the same time but independently and DO NOT need to be in sync',
            '* Both pairs can switch the working athlete at any time and there is no minimum work requirement for any team mate',
            '* Teammates can help in changing the weights on the barbell',
          ],
        },
        scoreTypes: ['Reps', 'Time', 'Tiebreak'],
      },
      {
        wodNumber: 2,
        wodName: 'Beam me up, Scotty',
        wodSummary: 'AMREPS: Row, Pull-ups, Bike, Push-ups and rope climbs',
        categoryWodDescription: {
          Open: [
            'In 15 Minutes, complete as many Repetitions as possible of: ',
            '80 Calorie Row',
            '50 Pull-Ups',
            '60 Calorie Air Bike',
            '50 Ring Push-Ups ',
            'Max Legless Rope Climb from seated (8ft)',
            'Only one teammate can accumulate repetitions at a time',
            'Non-working teammates - 60 kg Barbell Hold (Racked)',
            '',
            'The score is the number of Repetitions completed at the 15 minute mark',
            'The time at the completion of push ups will be noted for tie breaks',
            '',
            '* Teams can switch working the athlete at any time, there is no minimum work requirement for any team mate',
            '* Any number of teammates may be holding the barbells',
            '* Barbell MUST be held on or above the shoulders for the working teammate to be able to accumulate reps. If the barbell comes down, the working teammate MUST stop',
          ],
          Intermediate: [
            'In 15 Minutes complete as many Repetitions as possible of: ',
            '65 Calorie Row',
            '35 Pull-Ups',
            '50 Calorie Air Bike',
            '35 Hand Release Push-Ups',
            'Max Legless Rope Pull-Ups from seated',
            'Only one teammate can accumulate repetitions at a time',
            'Non-working teammates - 40 kg Barbell Hold (Racked)',
            '',
            'The score is the number of Repetitions completed at the 15 minute mark',
            'The time at the completion of push ups will be noted for tie breaks',
            '',
            '* Teams can switch working the athlete at any time, there is no minimum work requirement for any team mate',
            '* Any number of teammates may be holding the barbells',
            '* Barbell MUST be held on or above the shoulders for the working teammate to be able to accumulate reps. If the barbell comes down, the working teammate MUST stop',
          ],
          Beginner: [
            'In 15 Minutes complete as many Repetitions as possible of: ',
            '50 Calorie Row',
            '50 DB Renegade Rows @ 10kg',
            '35 Calorie Air Bike',
            '35 Hand Release Push-Ups from the Knees',
            'Max Lying to Standing Rope Climbs',
            'Only one teammate can accumulate repetitions at a time',
            'Non-working teammates - 30 kg Barbell Hold (Racked)',
            '',
            'The score is the number of Repetitions completed at the 15 minute mark',
            'The time at the completion of push ups will be noted for tie breaks',
            '',
            '* Teams can switch working the athlete at any time, there is no minimum work requirement for any team mate',
            '* Any number of teammates may be holding the barbells',
            '* Barbell MUST be held on or above the shoulders for the working teammate to be able to accumulate reps. If the barbell comes down, the working teammate MUST stop',
          ],
        },
        scoreTypes: ['Reps', 'Tiebreak'],
      },
      {
        wodNumber: 3,
        wodName: 'Sympathy for the Devil',
        wodSummary: "FT: Devil's Press, Shuttle runs and Double Unders",
        categoryWodDescription: {
          Open: [
            'For Time:',
            "As a F/M Pair, 80 Synchro Single Arm Dumbbell Devil's Press @ ♀ 15 kg / ♂ 20 kg",
            'Buy-In:',
            'Every 3:00, including 0:00',
            'Athlete 1, Athlete 2 - 14 Alternating Shuttle Runs (1 Shuttle Run = 25ft out and back)',
            'Athlete 3, Athlete 4 - Accumulate 100 Double Unders',
            'Time Cap: 21 Minutes',
            '',
            'Score is Total Time taken OR Total Repetitions completed at time cap',
            '',
            "* The ENTIRE TEAM MUST complete BOTH Buy-Ins (Shuttle Runs and Double Unders) every 3:00 BEFORE a F/M Pair starts the Devil's Presses.",
            '* The Shuttle Runs MUST be completed with both Athlete 1 and Athlete 2 alternating the runs. 1 Shuttle Run = 25ft out and back',
            '* The Double Unders may be split anyhow between Athlete 3 and Athlete 4, only one athlete working at a time',
            '* Teammates may switch between Shuttle Runs and Double Unders ONLY AFTER a 3-minute round is complete',
            "* A F/M Pair MUST perform the devil's press in sync. Working teammates on the devil's press may switch at any time, as long as it remains a F/M pair.",
            '* There is no minimum work requirement on any teammate, except the alternating shuttle run rule.',
          ],
          Intermediate: [
            'For Time:',
            "As a F/M Pair, 80 Synchro Single Arm Dumbbell Devil's Press @ ♀ 10 kg / ♂ 15 kg",
            'Buy-In:',
            'Every 3:00, including 0:00',
            'Athlete 1, Athlete 2 - 10 Alternating Shuttle Runs (1 Shuttle Run = 25ft out and back)',
            'Athlete 3, Athlete 4 - Accumulate 75 Double Unders',
            'Athletes can change stations as they want after each 3:00 round',
            'Time Cap: 21 Minutes',
            '',
            'Score is Total Time taken OR Total Repetitions completed at time cap',
            '',
            "* The ENTIRE TEAM MUST complete BOTH Buy-Ins (Shuttle Runs and Double Unders) every 3:00 BEFORE a F/M Pair starts the Devil's Presses.",
            '* The Shuttle Runs MUST be completed with both Athlete 1 and Athlete 2 alternating the runs. 1 Shuttle Run = 25ft out and back',
            '* The Double Unders may be split anyhow between Athlete 3 and Athlete 4, only one athlete working at a time',
            '* Teammates may switch between Shuttle Runs and Double Unders ONLY AFTER a 3-minute round is complete',
            "* A F/M Pair MUST perform the devil's press in sync. Working teammates on the devil's press may switch at any time, as long as it remains a F/M pair.",
            '* There is no minimum work requirement on any teammate, except the alternating shuttle run rule.',
          ],
          Beginner: [
            'For Time:',
            "As a F/M Pair, 60 Synchro Single Arm Dumbbell Devil's Press @ ♀ 7.5 kg / ♂ 10 kg",
            'Buy-In:',
            'Every 3:00, including 0:00',
            'Athlete 1, Athlete 2 - 8 Alternating Shuttle Runs (1 Shuttle Run = 25ft out and back)',
            'Athlete 3, Athlete 4 - Accumulate 150 Single Unders',
            'Athletes can change stations as they want after each 3:00 round',
            'Time Cap: 21 Minutes',
            '',
            'Score is Total Time taken OR Total Repetitions completed at time cap',
            '',
            "* The ENTIRE TEAM MUST complete BOTH Buy-Ins (Shuttle Runs and Single Unders) every 3:00 BEFORE a F/M Pair starts the Devil's Presses.",
            '* The Shuttle Runs MUST be completed with both Athlete 1 and Athlete 2 alternating the runs. 1 Shuttle Run = 25ft out and back',
            '* The Single Unders may be split anyhow between Athlete 3 and Athlete 4, only one athlete working at a time',
            '* Teammates may switch between Shuttle Runs and Single Unders ONLY AFTER a 3-minute round is complete',
            "* A F/M Pair MUST perform the devil's press in sync. Working teammates on the devil's press may switch at any time, as long as it remains a F/M pair.",
            '* There is no minimum work requirement on any teammate, except the alternating shuttle run rule.',
          ],
        },
        scoreTypes: ['Time', 'Reps'],
      },
      {
        wodNumber: 4,
        wodName: 'From the window to the wall',
        wodSummary: 'FT: Wall walks, Box jump overs, Cleans',
        categoryWodDescription: {
          Open: [
            'As a Team complete the following For Time: ',
            '12-9-6',
            'Wall-Walks ',
            'Box Jump Overs @ ♀ 20" / ♂ 24”',
            '(All teammates complete each repetition consecutively)',
            'Cleans @ ♀ 45kg / ♂ 70kg',
            'Time cap: 12 Minutes',
            '',
            'Score is Total Time taken OR Total Repetitions completed at time cap',
            '',
            '* ONLY ONE teammate works at one time on the Wall Walks and the Cleans, i.e. ONLY ONE barbell MUST be in play',
            '* The repetitions may be split between Male and Female teammates. There is no minimum work requirement for any one teammate on the wall walks or the cleans',
            '* ALL teammates MUST complete each repetition of the Box Jump Over one after the other for a repetition to count (12 each , then 9 each and then 6 each)',
          ],
          Intermediate: [
            'As a Team complete the following For Time: ',
            '12-9-6',
            'Partial Wall-Walks ',
            'Box Jump Overs @ ♀ 20" / ♂ 20”',
            '(All teammates complete each repetition consecutively)',
            'Cleans @ ♀ 35kg / ♂ 50kg',
            'Time cap: 12 Minutes',
            '',
            'Score is Total Time taken OR Total Repetitions completed at time cap',
            '',
            '* ONLY ONE teammate works at one time on the Wall Walks and the Cleans, i.e. ONLY ONE barbell MUST be in play',
            '* The repetitions may be split between Male and Female teammates. There is no minimum work requirement for any one teammate on the wall walks or the cleans',
            '* ALL teammates MUST complete each repetition of the Box Jump Over one after the other for a repetition to count (12 each , then 9 each and then 6 each)',
          ],
          Beginner: [
            'As a Team complete the following For Time: ',
            '12-9-6',
            '10ft Bear Crawls (10ft = 1 rep)',
            'Box Step Overs @ ♀ 20" / ♂ 20”',
            '(All teammates complete each repetition consecutively)',
            'Cleans @ ♀ 25kg / ♂ 35kg',
            'Time cap: 12 Minutes',
            '',
            'Score is Total Time taken OR Total Repetitions completed at time cap',
            '',
            '* ONLY ONE teammate works at one time on the Bear Crawls and the Cleans, i.e. ONLY ONE barbell MUST be in play',
            '* The repetitions may be split between Male and Female teammates. There is no minimum work requirement for any one teammate on the bear crawls or the cleans',
            '* ALL teammates MUST complete each repetition of the Box Step Over one after the other for a repetition to count (12 each , then 9 each and then 6 each)',
          ],
        },
        scoreTypes: ['Time', 'Reps'],
      },
    ],
    wodsUrl: 'assets/standards/dtteams2025-wods.pdf',
  },
  dtteams2026: {
    eventName: 'Deccan Throwdown Teams 2026',
    eventType: 'teams',
    eventDates: 'Nov 28th & 29th, 2026',
    tagline:
      'Teams of 6 athletes (2 female, 4 male). Categories: Scaled, Open.',
    registrationStatus: 'open',
    leaderboardEnabled: true,
    categories: ['Open', 'Scaled'],
    athletesPerTeam: 6,
    femaleAthletesPerTeam: 2,
    maleAthletesPerTeam: 4,
    registrationPricing: {
      standard: 13000,
      earlyBird: 10000,
      earlyBirdDeadline: 'Nov 15th, 2026',
    },
    wods: [
      {
        wodNumber: 1,
        wodName: 'Shoot for the Stars',
        wodSummary:
          '12 Min AMRAP: Partner Wall-Ball Shots, Gymnastics, Max Bar Muscle-Ups',
        categoryWodDescription: {
          Open: [
            '12 Min AMRAP as a team:',
            '150 Partner Wall-Ball Shots (Pair 1 @ 9kg, Pair 2, 3 @ 6kg)',
            '30 Toes-to-Bar (Split anyhow)',
            '30 Pull-Ups (Split anyhow)',
            '30 Synchro Toes-to-Bar (Any 2 athletes at a time)',
            '30 Synchro Pull-Ups (Any 2 athletes at a time)',
            'Max Bar Muscle-Ups in remaining time (Split anyhow)',
            '',
            'Workout Flow:',
            'The team will be divided into three pairs for the Wall-Ball Shots.',
            'Each pair must complete 50 Partner Wall-Ball Shots before the next pair can start their work.',
            'Pair 1 must use 9kg, while Pair 2 and 3 use a 6kg medball.',
            'The team then goes on to finish the 30 Toes-to-Bars and 30 Pull-Ups, followed by the Synchro Toes-to-Bars and Synchro Pull-Ups and ending with the Max. Bar Muscle-Ups.',
            'The synchro movements require any 2 athletes working together, but there is no minimum individual work requirement on the gymnastics movements. The gymnastics movements can be divided anyhow, and the working athletes can be changed at any time.',
          ],
          Scaled: [
            '12 Min AMRAP as a team:',
            '120 Partner Wall-Ball Shots (Pair 1 @ 6kg, Pair 2, 3 @ 4kg)',
            '30 Synchro Sit-Ups (Any 2 athletes at a time)',
            '30 Ring Rows (Split anyhow)',
            '30 Synchro Sit-Ups (Any 2 athletes at a time)',
            '30 Ring Rows (Split anyhow)',
            'Max Toes-to-Bar in remaining time',
            '',
            'Workout Flow:',
            'The team will be divided into three pairs for the Wall-Ball Shots.',
            'Each pair must complete 40 Partner Wall-Ball Shots before the next pair can start their work.',
            'Pair 1 must use 6kg, while Pair 2 and 3 use a 4kg medball.',
            'The team then goes on to finish 2 rounds of 30 Synchro Sit-Ups and 30 Ring Rows, ending with the Max. Toes-to-Bars.',
            'The synchro movements require any 2 athletes working together, but there is no minimum individual work requirement on the gymnastics movements. The gymnastics movements can be divided anyhow, and the working athletes can be changed at any time.',
          ],
        },
        scoreTypes: ['Reps', 'Tiebreak'],
      },
      {
        wodNumber: 2,
        wodName: "Down 'n Dirty",
        wodSummary: 'Synchro DB Box Step-Overs & Synchro Burpees',
        categoryWodDescription: {
          Open: [
            'For time:',
            '70 Synchro DB Box Step-Overs - MMF1 @ 10,15,15kg, 20"',
            '50 Synchro Bar Facing Burpees - MMMMFF',
            '70 Synchro DB Box Step-Overs - MMF2 @ 10,15,15kg, 20"',
            '',
            'Workout Flow:',
            'The team will be split into Male-Male-Female triplets (MMF1 and MMF2).',
            'One MMF team completes the first set of Synchro Box Step-Overs.',
            'All 6 athletes then complete the Synchro Burpees.',
            'The second MMF team then goes on to finish the second set of Synchro Box Step-Overs.',
          ],
          Scaled: [
            'For time:',
            '60 Synchro Box Step-Overs @20" - MMF1',
            '40 Synchro Burpees - MMMMFF',
            '60 Synchro Box Step-Overs @20" - MMF2',
            '',
            'Workout Flow:',
            'The team will be split into Male-Male-Female triplets (MMF1 and MMF2).',
            'One MMF team completes the first set of Synchro Box Step-Overs.',
            'All 6 athletes then complete the Synchro Burpees.',
            'The second MMF team then goes on to finish the second set of Synchro Box Step-Overs.',
          ],
        },
        scoreTypes: ['Time', 'Reps'],
      },
      {
        wodNumber: 3,
        wodName: 'WOD 3 — TBA',
        wodSummary: 'For-time team workout — details coming soon',
        categoryWodDescription: {
          Open: [
            'Workout structure and movement standards to be confirmed.',
            'Score is total time or repetitions completed at time cap.',
          ],
          Scaled: [
            'Workout structure and movement standards to be confirmed.',
            'Score is total time or repetitions completed at time cap.',
          ],
        },
        scoreTypes: ['Time', 'Reps'],
      },
      {
        wodNumber: 4,
        wodName: 'WOD 4 — TBA',
        wodSummary: 'Max-weight team workout — details coming soon',
        categoryWodDescription: {
          Open: [
            'Athletes will establish a team max lift — movement TBA.',
            'Details including time cap and tiebreak rules coming soon.',
          ],
          Scaled: [
            'Athletes will establish a team max lift — movement TBA.',
            'Scaled loading will apply for this division.',
          ],
        },
        scoreTypes: ['Weight'],
      },
      {
        wodNumber: 5,
        wodName: 'Utha le.. Utha le',
        wodSummary: 'Ground-to-Overheads Ladder',
        categoryWodDescription: {
          Open: [
            'For Time, As a Team:',
            '36 Ground-to-Overheads @ Weight 1',
            '24 Ground-to-Overheads @ Weight 2',
            '12 Ground-to-Overheads @ Weight 3',
            '6 Ground-to-Overheads @ Weight 4',
            'TIME CAP: 6:00',
            '',
            'Workout Flow:',
            'All athletes complete 6 Ground-to-Overheads with Weight 1, the team then moves on to Weight 2, where all athletes must complete 4 repetitions each, then 2 repetitions each at Weight 3 and finally 1 repetition each at Weight 4.',
            'Weights to be announced at the event'
            // 'Women @ 30kg, 35kg, 40kg, 45kg',
            // 'Men @ 40kg, 50kg, 60kg, 70kg',
          ],
          Scaled: [
            'For Time, As a Team:',
            '36 Ground-to-Overheads @ Weight 1',
            '24 Ground-to-Overheads @ Weight 2',
            '12 Ground-to-Overheads @ Weight 3',
            '6 Ground-to-Overheads @ Weight 4',
            'TIME CAP: 6:00',
            '',
            'Workout Flow:',
            'All athletes complete 6 Ground-to-Overheads with Weight 1, the team then moves on to Weight 2, where all athletes must complete 4 repetitions each, then 2 repetitions each at Weight 3 and finally 1 repetition each at Weight 4.',
            'Weights to be announced at the event'
            // 'Women @ 20kg, 25kg, 30kg, 35kg',
            // 'Men @ 30kg, 35kg, 40kg, 45kg',
          ],
        },
        scoreTypes: ['Time', 'Reps'],
      },
    ],
  },
};

export const defaultConfig = 'dtteams2026';

/** Past events shown in the archive section of the menu. */
export const archiveEventShortNames: string[] = [
  'dtteams2025',
  'dtpairs2025',
];

/** Events with photo galleries under src/assets/images/<eventShortName>/. */
export const galleryEventShortNames: string[] = [
  'dtteams2025',
  'dtpairs2025',
];

export function isArchivedEvent(eventShortName: string): boolean {
  return archiveEventShortNames.includes(eventShortName);
}
