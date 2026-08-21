import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '@kabootar/shared';

export const GetUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
