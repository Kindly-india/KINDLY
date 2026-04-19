import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import * as Sentry from '@sentry/node';

@Catch()
export class SentryExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    // Only capture real bugs (5xx or non-HTTP) — skip user errors (4xx)
    const isClientError =
      exception instanceof HttpException && exception.getStatus() < 500;
    if (!isClientError) {
      Sentry.captureException(exception);
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();
      response.status(status).json(
        typeof res === 'string' ? { statusCode: status, message: res } : res,
      );
    } else {
      response.status(500).json({
        statusCode: 500,
        message: 'Internal server error',
      });
    }
  }
}
