import { Routes } from '@angular/router';

export const LANDING_TIME_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./landing-time-entry.component').then((m) => m.LandingTimeEntryComponent),
  },
];
