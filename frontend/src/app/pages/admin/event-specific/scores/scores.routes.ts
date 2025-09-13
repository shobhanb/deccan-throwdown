import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./scores.page').then((m) => m.ScoresPage),
  },
  {
    path: ':wodNumber',
    loadComponent: () =>
      import('./categories/categories.page').then((m) => m.CategoriesPage),
  },
  {
    path: ':wodNumber/:teamId',
    loadComponent: () =>
      import('./categories/score/score.page').then((m) => m.ScorePage),
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full',
  },
];
