import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { OrganizerSessionService } from '../services/organizer-session.service';

export const organizerSessionGuard: CanActivateFn = (route) => {
  const session = inject(OrganizerSessionService);
  const router = inject(Router);
  const token = route.parent?.paramMap.get('token') ?? route.paramMap.get('token') ?? '';

  if (session.hasValidSession(token)) {
    return true;
  }

  return router.createUrlTree(['/organizer', token]);
};
