import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

export function SwaggerAddWordToFavoritesEndpoint() {
  return applyDecorators(
    ApiOperation({
      summary: 'Add a word to favorites',
      description: 'Add a specific word to the users favorites',
    }),
    ApiParam({
      name: 'word',
      required: true,
      description: 'The word to add to favorites',
      example: 'fire',
    }),
    ApiResponse({
      status: 204,
      description: 'Word added to favorites',
    }),
    ApiResponse({
      status: 404,
      description: `couldn't find <word>`,
    }),
    ApiResponse({
      status: 400,
      description: `failed to fetch entry details`,
    }),
  );
}
