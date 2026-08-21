import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../services/auth.service';
import { OrganizerSessionService } from '../services/organizer-session.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const organizerSession = inject(OrganizerSessionService);
  const router = inject(Router);

  const token = router.url.startsWith('/organizer')
    ? organizerSession.getAccessToken()
    : authService.getAccessToken();

  if (token) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }

  return next(req);
};
