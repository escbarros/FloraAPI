import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';

export function SwaggerSignupEndpoint() {
  return applyDecorators(
    ApiOperation({
      summary: 'User registration',
      description: 'Register a new user with email, name and password',
    }),
    ApiBody({
      description: 'User registration data',
      schema: {
        type: 'object',
        properties: {
          email: {
            type: 'string',
            format: 'email',
            example: 'user@example.com',
          },
          name: {
            type: 'string',
            example: 'John Doe',
          },
          password: {
            type: 'string',
            minLength: 6,
            example: 'password123',
          },
        },
        required: ['email', 'name', 'password'],
      },
    }),
    ApiResponse({
      status: 201,
      description: 'User created successfully',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'uuid-string' },
          name: { type: 'string', example: 'John Doe' },
          token: { type: 'string', example: 'jwt-token-string' },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request - Invalid input data',
    }),
  );
}
