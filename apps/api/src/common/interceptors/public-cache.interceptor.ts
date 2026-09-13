import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';

function cacheControlFor(path: string): string | null {
  if (path.includes('/results')) {
    return 'public, s-maxage=10, stale-while-revalidate=30';
  }

  if (path.includes('/tournaments') || path.includes('/race-days')) {
    return 'public, s-maxage=30, stale-while-revalidate=120';
  }

  return null;
}

@Injectable()
export class PublicCacheInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context
      .switchToHttp()
      .getRequest<{ method?: string; originalUrl?: string; url?: string }>();
    const response = context
      .switchToHttp()
      .getResponse<{ setHeader(name: string, value: string): void }>();

    if ((request.method ?? '').toUpperCase() !== 'GET') {
      return next.handle();
    }

    const cacheControl = cacheControlFor(request.originalUrl ?? request.url ?? '');
    if (!cacheControl) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(() => {
        response.setHeader('Cache-Control', cacheControl);
      }),
    );
  }
}
