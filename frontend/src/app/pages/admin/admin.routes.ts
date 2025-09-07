import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'events',
    loadComponent: () =>
      import('./events/events.page').then((m) => m.EventsPage),
  },
  {
    path: 'events/create-event',
    loadComponent: () =>
      import('./events/edit-event/edit-event.page').then(
        (m) => m.EditEventPage
      ),
  },
  {
    path: 'events/:eventShortName',
    loadComponent: () =>
      import('./events/edit-event/edit-event.page').then(
        (m) => m.EditEventPage
      ),
  },
  {
    path: 'teams',
    loadComponent: () => import('./teams/teams.page').then((m) => m.TeamsPage),
  },
  {
    path: 'teams/create-team',
    loadComponent: () =>
      import('./teams/edit-team/edit-team.page').then((m) => m.EditTeamPage),
  },
  {
    path: 'teams/:teamId',
    loadComponent: () =>
      import('./teams/edit-team/edit-team.page').then((m) => m.EditTeamPage),
  },
  {
    path: 'athletes/create-athlete/:teamId',
    loadComponent: () =>
      import('./athletes/athletes.page').then((m) => m.AthletesPage),
  },
  {
    path: 'athletes/edit-athlete/:athleteId',
    loadComponent: () =>
      import('./athletes/athletes.page').then((m) => m.AthletesPage),
  },
  {
    path: 'wods',
    loadComponent: () => import('./wods/wods.page').then((m) => m.WodsPage),
  },
  {
    path: 'scores',
    loadComponent: () =>
      import('./scores/scores.page').then((m) => m.ScoresPage),
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: 'home',
    pathMatch: 'full',
  },
];
