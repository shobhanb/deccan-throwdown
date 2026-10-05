import { Routes } from '@angular/router';
import { SeoRouteData } from '../../config/seo.config';

const homeSeo: SeoRouteData = {
  title: 'Deccan Throwdown — CrossFit Team Competition at CrossFit Monkey Flag',
  description:
    'Deccan Throwdown is a CrossFit team competition hosted at CrossFit Monkey Flag in Pune. View WODs, register your team, follow the leaderboard, and event updates.',
};

const wodsSeo: SeoRouteData = {
  title: 'WODs — Deccan Throwdown CrossFit Workouts',
  description:
    'Workout descriptions and movement standards for Deccan Throwdown — the CrossFit competition at CrossFit Monkey Flag.',
};

const teamsSeo: SeoRouteData = {
  title: 'Teams — Deccan Throwdown',
  description:
    'Registered teams and divisions for Deccan Throwdown, the CrossFit team throwdown at CrossFit Monkey Flag.',
};

const leaderboardSeo: SeoRouteData = {
  title: 'Leaderboard — Deccan Throwdown Live Scores',
  description:
    'Live CrossFit competition leaderboard and scores for Deccan Throwdown at CrossFit Monkey Flag.',
};

const picsSeo: SeoRouteData = {
  title: 'Gallery — Deccan Throwdown Photos',
  description:
    'Photos from Deccan Throwdown CrossFit competitions at CrossFit Monkey Flag.',
};

const learnSeo: SeoRouteData = {
  title: 'While You Wait — CrossFit Fundamentals — Deccan Throwdown',
  description:
    'A short CrossFit lesson while you wait: one movement, idea, or benchmark, two questions, then the answer.',
};

const registerSeo: SeoRouteData = {
  title: 'Register — Deccan Throwdown Team Registration',
  description:
    'Register your team for Deccan Throwdown — CrossFit team competition at CrossFit Monkey Flag, Pune.',
};

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
    data: { seo: homeSeo },
  },
  {
    path: 'leaderboard',
    loadComponent: () =>
      import('./leaderboard/leaderboard.page').then((m) => m.LeaderboardPage),
    data: { seo: leaderboardSeo },
  },
  {
    path: 'leaderboard/:eventShortName',
    loadComponent: () =>
      import('./leaderboard/leaderboard.page').then((m) => m.LeaderboardPage),
    data: { seo: leaderboardSeo },
  },
  {
    path: 'teams',
    loadComponent: () => import('./teams/teams.page').then((m) => m.TeamsPage),
    data: { seo: teamsSeo },
  },
  {
    path: 'teams/:eventShortName',
    loadComponent: () => import('./teams/teams.page').then((m) => m.TeamsPage),
    data: { seo: teamsSeo },
  },
  {
    path: 'wods',
    loadComponent: () => import('./wods/wods.page').then((m) => m.WodsPage),
    data: { seo: wodsSeo },
  },
  {
    path: 'wods/:eventShortName',
    loadComponent: () => import('./wods/wods.page').then((m) => m.WodsPage),
    data: { seo: wodsSeo },
  },
  {
    path: 'learn',
    loadComponent: () => import('./learn/learn.page').then((m) => m.LearnPage),
    data: { seo: learnSeo },
  },
  {
    path: 'pics',
    loadComponent: () => import('./pics/pics.page').then((m) => m.PicsPage),
    data: { seo: picsSeo },
  },
  {
    path: 'register/test',
    loadComponent: () =>
      import('./register/test-register.page').then((m) => m.TestRegisterPage),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./register/register.page').then((m) => m.RegisterPage),
    data: { seo: registerSeo },
  },
  {
    path: 'redirect',
    loadComponent: () =>
      import('./redirect/redirect.page').then((m) => m.RedirectPage),
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
