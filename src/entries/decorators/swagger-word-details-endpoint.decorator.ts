import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

export function SwaggerWordDetailsEndpoint() {
  return applyDecorators(
    ApiOperation({
      summary: 'Search for word details',
      description: 'Get details of a specific word',
    }),
    ApiParam({
      name: 'word',
      required: true,
      description: 'The word to retrieve details for',
      example: 'fire',
    }),
    ApiResponse({
      status: 200,
      description: 'Details of the word',
      schema: {
        type: 'object',
        properties: {
          word: { type: 'string', example: 'fire' },
          meanings: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                partOfSpeech: { type: 'string', example: 'noun' },
                definitions: {
                  type: 'array',
                  items: { type: 'string', example: 'Combustion or burning' },
                },
              },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: `couldn't find definitions for the word <word>`,
    }),
    ApiResponse({
      status: 400,
      description: `failed to fetch entry details`,
    }),
  );
}
