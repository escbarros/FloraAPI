import {
  Controller,
  Get,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtGuard } from '../shared/middleware/jwt.guard';
import type { RequestWithUser } from '../shared/types/JwtRequest';
import { EntriesService } from './entries.service';
import { EntryQuerySearchRequestSchema } from './dto/entry-query-search-request-dto';

@ApiTags('Entries')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtGuard)
@Controller('entries')
export class EntriesController {
  constructor(private readonly entryService: EntriesService) {}

  @Get('en')
  @ApiOperation({
    summary: 'Search for entries',
    description: 'Search for entries by keyword',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search keyword',
    example: 'fire',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of results per page',
    example: 10,
  })
  @ApiResponse({
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
  })
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
  async getEntryDetail(
    @Request() req: RequestWithUser,
    @Param('word') word: string,
  ) {
    const wordDetails = await this.entryService.getEntryDetail(word);
    return wordDetails;
  }
}
