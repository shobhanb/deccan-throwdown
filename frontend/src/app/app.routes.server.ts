import {
  PrerenderFallback,
  RenderMode,
  ServerRoute,
} from '@angular/ssr';
import { archiveEventShortNames } from './config/config';

async function archiveEventParams(): Promise<Record<string, string>[]> {
  return archiveEventShortNames.map((eventShortName) => ({ eventShortName }));
}

export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'home', renderMode: RenderMode.Prerender },
  { path: 'pics', renderMode: RenderMode.Prerender },
  { path: 'register', renderMode: RenderMode.Prerender },
  { path: 'register/test', renderMode: RenderMode.Client },
  { path: 'redirect', renderMode: RenderMode.Client },
  { path: 'leaderboard', renderMode: RenderMode.Prerender },
  { path: 'teams', renderMode: RenderMode.Prerender },
  { path: 'wods', renderMode: RenderMode.Prerender },
  { path: 'learn', renderMode: RenderMode.Prerender },
  { path: 'learn/:lessonId', renderMode: RenderMode.Client },
  {
    path: 'leaderboard/:eventShortName',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: archiveEventParams,
    fallback: PrerenderFallback.Client,
  },
  {
    path: 'teams/:eventShortName',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: archiveEventParams,
    fallback: PrerenderFallback.Client,
  },
  {
    path: 'wods/:eventShortName',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: archiveEventParams,
    fallback: PrerenderFallback.Client,
  },
  { path: 'auth/**', renderMode: RenderMode.Client },
  { path: 'admin/**', renderMode: RenderMode.Client },
  { path: '**', renderMode: RenderMode.Client },
];
