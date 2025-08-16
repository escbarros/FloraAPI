import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { EntryQuerySearchRequestDto } from './dto/entry-query-search-request-dto';
import { EntryQuerySearchResponseDto } from './dto/entry-query-search-response-dto';
import { PrismaService } from '../shared/prisma.service';
import { HttpService } from '@nestjs/axios';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import { EntryWordDetailFoundResponseDto } from './dto/entry-word-detail-found-response-dto';

@Injectable()
export class EntriesService {
  private readonly baseUrl = 'https://api.dictionaryapi.dev/api/v2/entries/en/';
  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
  ) {}

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

  async getEntryDetail(word: string): Promise<EntryWordDetailFoundResponseDto> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}${word}`),
      );

      return response.data as EntryWordDetailFoundResponseDto;
    } catch (err: unknown) {
      if (
        err instanceof AxiosError &&
        err.response?.status === HttpStatus.NOT_FOUND
      ) {
        throw new NotFoundException(
          `couldn't find definitions for the word ${word}`,
        );
      }

      throw new Error('failed to fetch entry details');
    }
  }

  async getWordId(word: string): Promise<string> {
    const entry = await this.prisma.words.findUnique({
      where: { word },
      select: { id: true },
    });

    if (!entry) {
      throw new NotFoundException(`Word not found: ${word}`);
    }

    return entry.id;
  }
}
