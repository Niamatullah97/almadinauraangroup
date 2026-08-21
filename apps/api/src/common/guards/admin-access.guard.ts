import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { isOrganizerToken, UserRole } from '@kabootar/shared';

import { IS_PUBLIC_KEY } from '../decorators/auth.decorators';

@Injectable()
export class AdminAccessGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user) return true;

    if (user.role === UserRole.SUPER_ADMIN || isOrganizerToken(user)) {
      return true;
    }

    throw new ForbiddenException('Admin dashboard is restricted to Super Admin');
  }
}
