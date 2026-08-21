import { Routes } from '@angular/router';

export const PIGEON_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pigeon-list.component').then((m) => m.PigeonListComponent),
  },
];
