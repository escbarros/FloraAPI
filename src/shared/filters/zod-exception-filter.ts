import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ZodError } from 'zod';

interface ErrorResponse {
  statusCode: number;
  message: string;
}

@Catch(ZodError)
export class ZodExceptionFilter implements ExceptionFilter {
  catch(exception: ZodError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const statusCode = HttpStatus.BAD_REQUEST;

    const errorResponse: ErrorResponse = {
      statusCode: statusCode,
      message: exception.issues[0]?.message || 'validation failed.',
    };

    response.status(statusCode).json(errorResponse);
  }
}
