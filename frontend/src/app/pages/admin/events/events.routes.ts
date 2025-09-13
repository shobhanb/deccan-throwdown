import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./events.page').then((m) => m.EventsPage),
  },
  {
    path: 'create-event',
    loadComponent: () =>
      import('./edit-event/edit-event.page').then((m) => m.EditEventPage),
  },
  {
    path: ':eventShortName',
    loadComponent: () =>
      import('./edit-event/edit-event.page').then((m) => m.EditEventPage),
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full',
  },
];
