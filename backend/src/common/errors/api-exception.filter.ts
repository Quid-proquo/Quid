import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorCode, ErrorCodes } from './error-codes';
import { getErrorTracker } from './error-tracker';

const STATUS_CODES: Record<number, ErrorCode> = {
  400: ErrorCodes.BAD_REQUEST,
  401: ErrorCodes.UNAUTHORIZED,
  403: ErrorCodes.FORBIDDEN,
  404: ErrorCodes.NOT_FOUND,
  409: ErrorCodes.CONFLICT,
};

/** Responds with `{ error: { code, message, details?, requestId } }`. */
@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request & { requestId?: string }>();
    const res = ctx.getResponse<Response>();
    const requestId =
      req.requestId ?? (req.headers?.['x-request-id'] as string | undefined) ?? '';

    let status: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let code: ErrorCode = ErrorCodes.INTERNAL_ERROR;
    let message = 'Internal server error';
    let details: unknown;

    const prismaCode = (exception as { code?: string })?.code;
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      code = STATUS_CODES[status] ?? ErrorCodes.BAD_REQUEST;
      const body = exception.getResponse();
      if (typeof body === 'string') {
        message = body;
      } else {
        const b = body as { message?: string | string[] };
        if (Array.isArray(b.message)) {
          message = 'Validation failed';
          code = ErrorCodes.VALIDATION_FAILED;
          details = b.message;
        } else {
          message = b.message ?? exception.message;
        }
      }
    } else if (prismaCode === 'P2002') {
      status = HttpStatus.CONFLICT;
      code = ErrorCodes.CONFLICT;
      message = 'Resource already exists';
    } else if (prismaCode === 'P2025') {
      status = HttpStatus.NOT_FOUND;
      code = ErrorCodes.RECORD_NOT_FOUND;
      message = 'Resource not found';
    }

    if (status >= 500) {
      getErrorTracker()?.capture(exception, { requestId, path: req.url });
    }

    res.status(status).json({
      error: { code, message, ...(details ? { details } : {}), requestId },
    });
  }
}
