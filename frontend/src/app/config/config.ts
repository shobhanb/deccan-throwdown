export interface AppConfig {
  eventName: string;
  categories: string[];
  athletesPerTeam: number;
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
  },
  dtteams2025: {
    eventName: 'Deccan Throwdown Teams 2025',
    categories: ['Beginner', 'Intermediate', 'Advanced'],
    athletesPerTeam: 4,
  },
};

export const defaultConfig = 'dtpairs2025';
