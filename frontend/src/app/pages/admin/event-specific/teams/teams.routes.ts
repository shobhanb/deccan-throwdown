import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./teams.page').then((m) => m.TeamsPage),
  },
  {
    path: 'create-team',
    loadComponent: () =>
      import('./edit-team/edit-team.page').then((m) => m.EditTeamPage),
  },
  {
    path: ':teamId',
    loadComponent: () =>
      import('./edit-team/edit-team.page').then((m) => m.EditTeamPage),
  },
  {
    path: 'create-athlete/:teamId',
    loadComponent: () =>
      import('./athletes/athletes.page').then((m) => m.AthletesPage),
  },
  {
    path: 'edit-athlete/:athleteId',
    loadComponent: () =>
      import('./athletes/athletes.page').then((m) => m.AthletesPage),
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full',
  },
];
