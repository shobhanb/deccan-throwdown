export interface AppConfig {
  eventName: string;
  categories: string[];
  athletesPerTeam: number;
  wods: WodConfig[];
}

export interface WodConfig {
  wodNumber: number;
  wodName: string;
  wodDescription: string;
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
        wodDescription: 'woder 1',
      },
      {
        wodNumber: 2,
        wodName: 'काका ! मला वाचवा !',
        wodDescription: 'woder 2 bro',
      },
      {
        wodNumber: 3,
        wodName: 'Love Boat',
        wodDescription: 'woder 2 bro',
      },
      {
        wodNumber: 4,
        wodName: 'Heavy Triple',
        wodDescription: '5 mins to establish a Max. 3-Rep Hang Clean',
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
        wodDescription: 'Hago',
      },
      {
        wodNumber: 2,
        wodName: 'Beer and Burpees',
        wodDescription: 'Drink beer while doing burpees',
      },
      {
        wodNumber: 3,
        wodName: 'Ok lets WOD also',
        wodDescription: 'asdf',
      },
      {
        wodNumber: 4,
        wodName: 'Soneka Time',
        wodDescription: 'asdf',
      },
    ],
  },
};

export const defaultConfig = 'dtteams2025';
