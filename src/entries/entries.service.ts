import { Injectable } from '@nestjs/common';
import { EntryQuerySearchRequestDto } from './dto/entry-query-search-request-dto';
import { EntryQuerySearchResponseDto } from './dto/entry-query-search-response-dto';
import { PrismaService } from '../shared/prisma.service';

@Injectable()
export class EntriesService {
  constructor(private readonly prisma: PrismaService) {}

  async getEntries(
    query: EntryQuerySearchRequestDto,
  ): Promise<EntryQuerySearchResponseDto> {
    const { search, page, limit } = query;
    const skip = (page - 1) * limit;

    const [words, totalDocs] = await Promise.all([
      this.prisma.words.findMany({
        where: {
          word: {
            contains: search,
            mode: 'insensitive',
          },
        },
        skip,
        take: limit,
        select: {
          word: true,
        },
      }),
      this.prisma.words.count({
        where: {
          word: {
            contains: search,
            mode: 'insensitive',
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(totalDocs / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      results: words.map((entry) => entry.word),
      totalDocs,
      page,
      totalPages,
      hasNext,
      hasPrev,
    };
  }
}
