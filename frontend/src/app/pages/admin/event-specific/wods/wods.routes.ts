import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./wods.page').then((m) => m.WodsPage),
  },
  {
    path: 'create-wod',
    loadComponent: () =>
      import('./edit-wod/edit-wod.page').then((m) => m.EditWodPage),
  },
  {
    path: 'edit-wod/:wodId',
    loadComponent: () =>
      import('./edit-wod/edit-wod.page').then((m) => m.EditWodPage),
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full',
  },
];
