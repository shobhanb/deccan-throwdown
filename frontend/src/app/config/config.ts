export interface CategoryConfig {
  [key: string]: {
    categories: string[];
    athletesPerTeam: number;
  };
}

export const categoryConfig: CategoryConfig = {
  dtpairs2025: {
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
    categories: ['Beginner', 'Intermediate', 'Advanced'],
    athletesPerTeam: 4,
  },
};
