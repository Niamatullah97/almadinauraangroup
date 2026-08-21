import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { superAdminGuard } from './core/guards/super-admin.guard';
import { AUTH_ROUTES } from './features/auth/auth.routes';

export const routes: Routes = [
  {
    path: 'auth',
    children: AUTH_ROUTES,
  },
  {
    path: 'organizer/:token',
    loadChildren: () =>
      import('./features/organizer/organizer.routes').then((m) => m.ORGANIZER_ROUTES),
  },
  {
    path: '',
    canActivate: [authGuard, superAdminGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./layout/admin-layout/admin-layout.component').then(
            (m) => m.AdminLayoutComponent,
          ),
        children: [
          {
            path: '',
            redirectTo: 'dashboard',
            pathMatch: 'full',
          },
          {
            path: 'dashboard',
            loadComponent: () =>
              import('./features/dashboard/dashboard.component').then(
                (m) => m.DashboardComponent,
              ),
            data: {
              title: 'Dashboard',
              subtitle: 'Overview of your tournament platform',
            },
          },
          {
            path: 'tournaments',
            loadChildren: () =>
              import('./features/tournaments/tournaments.routes').then(
                (m) => m.TOURNAMENT_ROUTES,
              ),
            data: {
              title: 'Tournaments',
              subtitle: 'Manage racing events and schedules',
            },
          },
          {
            path: 'pigeons',
            loadChildren: () =>
              import('./features/pigeons/pigeons.routes').then((m) => m.PIGEON_ROUTES),
            data: {
              title: 'Pigeons',
              subtitle: 'Track registered birds',
            },
          },
          {
            path: 'landing-times',
            loadChildren: () =>
              import('./features/landing-times/landing-times.routes').then(
                (m) => m.LANDING_TIME_ROUTES,
              ),
            data: {
              title: 'Landing Times',
              subtitle: 'Enter pigeon landing times by race day',
            },
          },
          {
            path: 'reports',
            loadChildren: () =>
              import('./features/reports/reports.routes').then((m) => m.REPORT_ROUTES),
            data: {
              title: 'Reports',
              subtitle: 'Download complete tournament and race day PDFs',
            },
          },
          {
            path: 'users',
            loadChildren: () =>
              import('./features/users/users.routes').then((m) => m.USER_ROUTES),
            data: {
              title: 'Users',
              subtitle: 'Manage participants and roles',
            },
          },
        ],
      },
    ],
  },
  { path: '**', redirectTo: 'auth/login' },
];
