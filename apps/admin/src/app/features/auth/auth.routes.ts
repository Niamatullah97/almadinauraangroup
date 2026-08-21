import { Routes } from '@angular/router';

import { guestGuard } from '../../core/guards/guest.guard';
import { LoginComponent } from './login.component';

export const AUTH_ROUTES: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent, canActivate: [guestGuard] },
];
