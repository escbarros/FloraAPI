import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtGuard } from '../shared/middleware/jwt.guard';
import { ConditionalCacheInterceptor } from '../shared/interceptors/conditional-cache.interceptor';
import { Cacheable } from '../shared/decorators/cacheable.decorator';
import { CacheService } from '../shared/cache.service';
import type { RequestWithUser } from '../shared/types/JwtRequest';
import { EntriesService } from './entries.service';
import { EntryQuerySearchRequestSchema } from './dto/entry-query-search-request-dto';
import { SwaggerQuerySearchEndpoint } from './decorators/swagger-query-search-endpoint.decorator';
import { SwaggerWordDetailsEndpoint } from './decorators/swagger-word-details-endpoint.decorator';
import { SwaggerAddWordToFavoritesEndpoint } from './decorators/swagger-add-word-to-favorites-endpoint.decorator';
import { SwaggerRemoveWordFromFavoritesEndpoint } from './decorators/swagger-remove-word-from-favorites-endpoint.decorator';

@ApiTags('Entries')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtGuard)
@UseInterceptors(ConditionalCacheInterceptor)
@Cacheable({ ttl: 300, keyPrefix: 'entries' })
@Controller('entries')
export class EntriesController {
  constructor(
    private readonly entryService: EntriesService,
    private readonly cacheService: CacheService,
  ) {}

  @Get('en')
  @SwaggerQuerySearchEndpoint()
  async getEntries(
    @Query('search') search?: string,
    @Query('limit') limit?: string,
    @Query('page') page?: string,
  ) {
    const parseResult = EntryQuerySearchRequestSchema.parse({
      search,
      limit,
      page,
    });
    const queryEntries = await this.entryService.getEntries(parseResult);
    return queryEntries;
  }

  @Get('en/:word')
  @SwaggerWordDetailsEndpoint()
  async getEntryDetail(
    @Request() req: RequestWithUser,
    @Param('word') word: string,
  ) {
    const { sub: userId } = req.user;
    const wordId = await this.entryService.getWordId(word);
    const wordDetails = await this.entryService.getEntryDetail(word);
    await this.entryService.addWordToHistory(userId, wordId);
    return wordDetails;
  }

  @Post('en/:word/favorite')
  @HttpCode(HttpStatus.NO_CONTENT)
  @SwaggerAddWordToFavoritesEndpoint()
  async addWordToFavorites(
    @Request() req: RequestWithUser,
    @Param('word') word: string,
  ) {
    const { sub: userId } = req.user;
    const wordId = await this.entryService.getWordId(word);
    await this.entryService.addWordToFavorites(userId, wordId);

    await this.cacheService.invalidateUserCache(userId);
  }

  @Delete('en/:word/unfavorite')
  @HttpCode(HttpStatus.NO_CONTENT)
  @SwaggerRemoveWordFromFavoritesEndpoint()
  async removeWordFromFavorites(
    @Request() req: RequestWithUser,
    @Param('word') word: string,
  ) {
    const { sub: userId } = req.user;
    const wordId = await this.entryService.getWordId(word);
    await this.entryService.removeWordFromFavorites(userId, wordId);

    await this.cacheService.invalidateUserCache(userId);
  }
}
