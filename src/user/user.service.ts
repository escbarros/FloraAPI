import { Injectable } from '@nestjs/common';
import { History } from '@prisma/client';
import { PrismaService } from '../shared/prisma.service';
import { Favorites } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async addWordToHistory(userId: string, wordId: string): Promise<History> {
    return await this.prisma.history.create({
      data: {
        user_id: userId,
        word_id: wordId,
      },
    });
  }

  async addWordToFavorites(userId: string, wordId: string): Promise<Favorites> {
    const existingFavorite = await this.prisma.favorites.findFirst({
      where: {
        user_id: userId,
        word_id: wordId,
      },
    });

    if (existingFavorite) {
      return existingFavorite;
    }

    return await this.prisma.favorites.create({
      data: {
        user_id: userId,
        word_id: wordId,
      },
    });
  }
}
