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
    path: 'users',
    loadComponent: () => import('./users/users.page').then((m) => m.UsersPage),
  },
  {
    path: 'notifications',
    loadComponent: () =>
      import('./notifications/notifications.page').then(
        (m) => m.NotificationsPage
      ),
  },
  {
    path: 'emails',
    loadComponent: () =>
      import('./emails/emails.page').then((m) => m.EmailsPage),
  },
  {
    path: 'phones',
    loadComponent: () =>
      import('./phones/phones.page').then((m) => m.PhonesPage),
  },
  {
    path: 'registration',
    loadComponent: () =>
      import('./registration/registration.page').then((m) => m.RegistrationPage),
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
