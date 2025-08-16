import { Injectable } from '@nestjs/common';
import { PrismaService } from '../shared/prisma.service';
import { UserHistoryRequestDto } from './dto/user-history-request-dto';
import { UserHistoryResponseDto } from './dto/user-history-response-dto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserHistory({
    userId,
    limit,
    page,
  }: UserHistoryRequestDto): Promise<UserHistoryResponseDto> {
    const skip = (page - 1) * limit;

    const [historyRecords, totalDocs] = await Promise.all([
      this.prisma.history.findMany({
        where: {
          user_id: userId,
        },
        select: {
          word: {
            select: {
              word: true,
            },
          },
          created_at: true,
        },
        skip,
        take: limit,
        orderBy: {
          created_at: 'desc',
        },
      }),
      this.prisma.history.count({
        where: {
          user_id: userId,
        },
      }),
    ]);

    const totalPages = Math.ceil(totalDocs / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      results: historyRecords.map((record) => ({
        word: record.word.word,
        added: record.created_at,
      })),
      totalDocs,
      page,
      totalPages,
      hasNext,
      hasPrev,
    };
  }
}
