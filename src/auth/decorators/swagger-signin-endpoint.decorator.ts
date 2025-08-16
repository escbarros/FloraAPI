import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';

export function SwaggerSigninEndpoint() {
  return applyDecorators(
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: 'User login',
      description: 'Login an existing user with email and password',
    }),
    ApiBody({
      description: 'User login data',
      schema: {
        type: 'object',
        properties: {
          email: {
            type: 'string',
            format: 'email',
            example: 'user@example.com',
          },
          password: {
            type: 'string',
            minLength: 6,
            example: 'password123',
          },
        },
        required: ['email', 'password'],
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request - Invalid input data',
    }),
    ApiResponse({
      status: 200,
      description: 'User logged on successfully',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'uuid-string' },
          name: { type: 'string', example: 'John Doe' },
          token: { type: 'string', example: 'jwt-token-string' },
        },
      },
    }),
  );
}
