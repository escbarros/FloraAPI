import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../shared/prisma.service';
import { UserListPaginationRequestDto } from './dto/user-list-pagination-request-dto';
import { UserListPagination } from './dto/user-history-response-dto';
import { User } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserProfile(userId: string): Promise<Partial<User>> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async getUserHistory({
    userId,
    limit,
    page,
  }: UserListPaginationRequestDto): Promise<UserListPagination> {
    const skip = (page - 1) * limit;

    const [records, totalDocs] = await Promise.all([
      this.prisma.history.findMany({
        where: { user_id: userId },
        select: {
          word: { select: { word: true } },
          created_at: true,
        },
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.history.count({
        where: { user_id: userId },
      }),
    ]);

    return this.buildPaginatedResponse(records, totalDocs, page, limit);
  }

  async getUserFavorites({
    userId,
    limit,
    page,
  }: UserListPaginationRequestDto): Promise<UserListPagination> {
    const skip = (page - 1) * limit;

    const [records, totalDocs] = await Promise.all([
      this.prisma.favorites.findMany({
        where: { user_id: userId },
        select: {
          word: { select: { word: true } },
          created_at: true,
        },
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.favorites.count({
        where: { user_id: userId },
      }),
    ]);

    return this.buildPaginatedResponse(records, totalDocs, page, limit);
  }

  private buildPaginatedResponse(
    records: Array<{ word: { word: string }; created_at: Date }>,
    totalDocs: number,
    page: number,
    limit: number,
  ): UserListPagination {
    const totalPages = Math.ceil(totalDocs / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      results: records.map((record) => ({
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
