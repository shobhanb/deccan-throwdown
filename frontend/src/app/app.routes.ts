import { Routes } from '@angular/router';
import { defaultConfig } from './config/config';

export const routes: Routes = [
  {
    path: ':eventShortName/public',
    loadChildren: () =>
      import('./pages/public/public.routes').then((m) => m.routes),
  },
  {
    path: ':eventShortName/admin',
    loadChildren: () =>
      import('./pages/admin/admin.routes').then((m) => m.routes),
  },
  {
    path: '',
    redirectTo: `${defaultConfig}/public/home`,
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: `${defaultConfig}/public/home`,
    pathMatch: 'full',
  },
];
