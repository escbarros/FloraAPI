import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';

export function SwaggerQuerySearchEndpoint() {
  return applyDecorators(
    ApiOperation({
      summary: 'Search for entries',
      description: 'Search for entries by keyword',
    }),
    ApiQuery({
      name: 'search',
      required: false,
      type: String,
      description: 'Search keyword',
      example: 'fire',
    }),
    ApiQuery({
      name: 'page',
      required: false,
      type: Number,
      description: 'Page number',
      example: 1,
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      description: 'Number of results per page',
      example: 10,
    }),
    ApiResponse({
      status: 200,
      description: 'Search results',
      schema: {
        type: 'object',
        properties: {
          result: {
            type: 'string[]',
            example: '[firebox, fireshine, pinfire, firespout]',
          },
          totalDocs: { type: 'number', example: 200 },
          page: { type: 'number', example: 1 },
          totalPages: { type: 'number', example: 50 },
          hasNext: { type: 'boolean', example: true },
          hasPrev: { type: 'boolean', example: false },
        },
      },
    }),
  );
}
