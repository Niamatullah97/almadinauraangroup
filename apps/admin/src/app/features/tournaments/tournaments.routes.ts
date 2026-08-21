import { Routes } from '@angular/router';

export const TOURNAMENT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./tournament-list.component').then((m) => m.TournamentListComponent),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./tournament-create.component').then((m) => m.TournamentCreateComponent),
    data: {
      title: 'Create Tournament',
      subtitle: 'Add a new racing event',
    },
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./tournament-edit.component').then((m) => m.TournamentEditComponent),
    data: {
      title: 'Edit Tournament',
      subtitle: 'Update tournament details',
    },
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./tournament-detail.component').then((m) => m.TournamentDetailComponent),
    data: {
      title: 'Tournament Details',
      subtitle: 'Review event information',
    },
  },
];
