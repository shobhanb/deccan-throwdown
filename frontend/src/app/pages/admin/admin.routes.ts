import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'events',
    loadChildren: () => import('./events/events.routes').then((m) => m.routes),
  },
  {
    path: ':eventShortName',
    loadChildren: () =>
      import('./event-specific/event-specific.routes').then((m) => m.routes),
  },
  {
    path: '**',
    redirectTo: '/home',
    pathMatch: 'full',
  },
];
