import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

const UNTHROTTLED_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function isUnthrottledHttpMethod(method: string | undefined): boolean {
  return UNTHROTTLED_METHODS.has((method ?? '').toUpperCase());
}

/**
 * Customer pages are SSR'd from a Cloudflare Worker, so many visitors share a
 * handful of outbound IPs. IP throttling on public GETs then looks like empty
 * tournament lists or Next.js 404s. Keep limits on mutating auth/admin routes.
 */
@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  protected override async shouldSkip(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ method?: string }>();
    if (isUnthrottledHttpMethod(request?.method)) {
      return true;
    }
    return super.shouldSkip(context);
  }
}
