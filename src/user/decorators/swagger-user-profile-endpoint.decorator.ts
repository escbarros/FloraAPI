import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function SwaggerUserProfileEndpoint() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get user profile',
      description: 'Retrieve the profile information of a specific user',
    }),
    ApiResponse({
      status: 200,
      description: 'Search results',
      schema: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: 'e0e6a620-43a3-435d-b7f2-802c26f9770c',
          },
          email: {
            type: 'string',
            example: 'mail@example.com',
          },
          name: {
            type: 'string',
            example: 'John Doe',
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: `User not found`,
    }),
    ApiResponse({
      status: 400,
      description: `failed to fetch entry details`,
    }),
  );
}
