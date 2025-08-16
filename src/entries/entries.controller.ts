import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtGuard } from '../shared/middleware/jwt.guard';
import type { RequestWithUser } from '../shared/types/JwtRequest';
import { EntriesService } from './entries.service';
import { EntryQuerySearchRequestSchema } from './dto/entry-query-search-request-dto';

@ApiTags('Entries')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('entries')
export class EntriesController {
  constructor(private readonly entryService: EntriesService) {}

  @Get('en')
  async getEntries(
    @Request() req: RequestWithUser,
    @Query('search') search?: string,
    @Query('limit') limit?: number,
    @Query('page') page?: number,
  ) {
    const parseResult = EntryQuerySearchRequestSchema.parse({
      search,
      limit,
      page,
    });
    const result = await this.entryService.getEntries(parseResult);
    return result;
  }
}
