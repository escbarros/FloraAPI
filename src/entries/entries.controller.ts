import {
  Controller,
  Get,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtGuard } from '../shared/middleware/jwt.guard';
import type { RequestWithUser } from '../shared/types/JwtRequest';
import { EntriesService } from './entries.service';
import { EntryQuerySearchRequestSchema } from './dto/entry-query-search-request-dto';
import { SwaggerQuerySearchEndpoint } from './decorators/swagger-query-search-endpoint.decorator';
import { SwaggerWordDetailsEndpoint } from './decorators/swagger-word-details-endpoint.decorator';

@ApiTags('Entries')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtGuard)
@Controller('entries')
export class EntriesController {
  constructor(private readonly entryService: EntriesService) {}

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
    const wordDetails = await this.entryService.getEntryDetail(word);
    return wordDetails;
  }
}
