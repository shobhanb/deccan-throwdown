import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full',
  },
  {
    path: 'admin',
    loadChildren: () =>
      import('./pages/admin/admin.routes').then((m) => m.routes),
  },
  {
    path: '',
    loadChildren: () =>
      import('./pages/public/public.routes').then((m) => m.routes),
  },
  {
    path: '**',
    redirectTo: '/home',
    pathMatch: 'full',
  },
];
