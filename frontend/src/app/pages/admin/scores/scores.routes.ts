import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./scores.page').then((m) => m.ScoresPage),
    data: {
      verificationMode: false,
    },
  },
  {
    path: 'verify',
    loadComponent: () => import('./scores.page').then((m) => m.ScoresPage),
    data: {
      verificationMode: true,
    },
  },
  {
    path: 'verify/:wodNumber',
    loadComponent: () =>
      import('./categories/categories.page').then((m) => m.CategoriesPage),
    data: {
      verificationMode: true,
    },
  },
  {
    path: ':wodNumber',
    loadComponent: () =>
      import('./categories/categories.page').then((m) => m.CategoriesPage),
    data: {
      verificationMode: false,
    },
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
