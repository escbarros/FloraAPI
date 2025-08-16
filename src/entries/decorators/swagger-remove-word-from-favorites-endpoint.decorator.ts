import { applyDecorators } from '@nestjs/common';
import {
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

export function SwaggerRemoveWordFromFavoritesEndpoint() {
  return applyDecorators(
    ApiOperation({
      summary: 'Remove word from user favorites',
      description:
        "Removes a word from the authenticated user's favorites list",
    }),
    ApiParam({
      name: 'word',
      description: 'The word to remove from favorites',
      example: 'fire',
    }),
    ApiNoContentResponse({
      description: 'Word successfully removed from favorites',
    }),
    ApiNotFoundResponse({
      description: 'Word not found in user favorites or word does not exist',
    }),
    ApiUnauthorizedResponse({
      description: 'User not authenticated',
    }),
  );
}
