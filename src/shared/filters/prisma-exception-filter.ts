// src/shared/filters/prisma-exception.filter.ts
import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let message = 'database error';

    if (exception.code === 'P2002') {
      const target = (exception.meta?.target as string[]).join(', ');
      message = `a record with the following field(s) already exists: ${target}`;
    }

    response.status(400).json({
      statusCode: 400,
      message,
    });
  }
}
