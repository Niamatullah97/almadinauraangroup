import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class HttpLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    const startedAt = Date.now();
    const requestId = req.headers['x-request-id'];

    res.on('finish', () => {
      const durationMs = Date.now() - startedAt;
      const payload = {
        requestId,
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        durationMs,
      };

      if (res.statusCode >= 500) {
        this.logger.error(JSON.stringify(payload));
        return;
      }

      if (res.statusCode >= 400) {
        this.logger.warn(JSON.stringify(payload));
        return;
      }

      this.logger.log(JSON.stringify(payload));
    });

    next();
  }
}
