import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'teams',
    loadChildren: () => import('./teams/teams.routes').then((m) => m.routes),
  },
  {
    path: 'scores',
    loadChildren: () => import('./scores/scores.routes').then((m) => m.routes),
  },
  {
    path: '',
    redirectTo: 'teams',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: 'teams',
    pathMatch: 'full',
  },
];
