import { Injectable } from '@nestjs/common';
import { History } from '@prisma/client';
import { PrismaService } from '../shared/prisma.service';

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
}
