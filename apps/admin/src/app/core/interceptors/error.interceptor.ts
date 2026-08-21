import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { AuthService } from '../services/auth.service';
import { OrganizerSessionService } from '../services/organizer-session.service';

function isAuthRequest(url: string): boolean {
  return /\/auth\/(login|register|refresh)(?:\?|$)/.test(url) || /\/organizer\/unlock(?:\?|$)/.test(url);
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const organizerSession = inject(OrganizerSessionService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isAuthRequest(req.url)) {
        if (router.url.startsWith('/organizer')) {
          const token = router.url.split('/')[2] ?? '';
          organizerSession.clear();
          if (token) {
            void router.navigate(['/organizer', token]);
          }
        } else {
          authService.logout();
        }
      }
      return throwError(() => error);
    }),
  );
};
