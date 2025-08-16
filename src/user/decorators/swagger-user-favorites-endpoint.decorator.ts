import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';

export function SwaggerUserFavoritesEndpoint() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get user word favorites',
      description: 'Retrieve the word favorites of a specific user',
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
            type: '{word: string, added: datetime}[]',
            example:
              '[{"word": "firebox", "added": "2023-01-01T00:00:00Z"}, {"word": "fireshine", "added": "2023-01-02T00:00:00Z"}, {"word": "pinfire", "added": "2023-01-03T00:00:00Z"}, {"word": "firespout", "added": "2023-01-04T00:00:00Z"}]',
          },
          totalDocs: { type: 'number', example: 8 },
          page: { type: 'number', example: 1 },
          totalPages: { type: 'number', example: 2 },
          hasNext: { type: 'boolean', example: true },
          hasPrev: { type: 'boolean', example: false },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: `couldn't find user word history for <userId>`,
    }),
    ApiResponse({
      status: 400,
      description: `failed to fetch entry details`,
    }),
  );
}
