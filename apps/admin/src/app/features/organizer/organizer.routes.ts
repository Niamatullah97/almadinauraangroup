import { Routes } from '@angular/router';

import { organizerSessionGuard } from '../../core/guards/organizer-session.guard';

export const ORGANIZER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./organizer-unlock.component').then((m) => m.OrganizerUnlockComponent),
    data: {
      title: 'Organizer access',
      subtitle: 'Enter the secret key to continue',
    },
  },
  {
    path: '',
    canActivate: [organizerSessionGuard],
    loadComponent: () =>
      import('./organizer-layout.component').then((m) => m.OrganizerLayoutComponent),
    children: [
      {
        path: 'preview',
        loadComponent: () =>
          import('./organizer-preview.component').then((m) => m.OrganizerPreviewComponent),
        data: {
          title: 'Tournament preview',
          subtitle: 'Read-only tournament details',
        },
      },
      {
        path: 'landing-times',
        loadComponent: () =>
          import('./organizer-landing-times.component').then(
            (m) => m.OrganizerLandingTimesComponent,
          ),
        data: {
          title: 'Landing times',
          subtitle: 'Enter pigeon landing times after the race starts',
        },
      },
    ],
  },
];
