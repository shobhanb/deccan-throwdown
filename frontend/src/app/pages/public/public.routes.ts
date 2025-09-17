import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'leaderboard',
    loadComponent: () =>
      import('./leaderboard/leaderboard.page').then((m) => m.LeaderboardPage),
  },
  {
    path: 'leaderboard/:eventShortName',
    loadComponent: () =>
      import('./leaderboard/leaderboard.page').then((m) => m.LeaderboardPage),
  },
  {
    path: 'teams',
    loadComponent: () => import('./teams/teams.page').then((m) => m.TeamsPage),
  },
  {
    path: 'teams/:eventShortName',
    loadComponent: () => import('./teams/teams.page').then((m) => m.TeamsPage),
  },
  {
    path: 'wods',
    loadComponent: () => import('./wods/wods.page').then((m) => m.WodsPage),
  },
  {
    path: 'wods/:eventShortName',
    loadComponent: () => import('./wods/wods.page').then((m) => m.WodsPage),
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
