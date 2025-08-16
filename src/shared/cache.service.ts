import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async get<T>(key: string): Promise<T | undefined> {
    return await this.cacheManager.get<T>(key);
  }

  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    const ttlMs = ttl ? ttl * 1000 : undefined;
    await this.cacheManager.set(key, value, ttlMs);
  }

  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  generateSearchKey(query: string, page?: number, limit?: number): string {
    return `search:${query}:${page || 1}:${limit || 10}`;
  }

  generateWordDetailKey(word: string): string {
    return `word:${word.toLowerCase()}`;
  }

  generateUserFavoritesKey(
    userId: string,
    page?: number,
    limit?: number,
  ): string {
    return `user:${userId}:favorites:${page || 1}:${limit || 10}`;
  }

  generateUserHistoryKey(
    userId: string,
    page?: number,
    limit?: number,
  ): string {
    return `user:${userId}:history:${page || 1}:${limit || 10}`;
  }

  async invalidateUserCache(userId: string): Promise<void> {
    const patterns = [
      `user:${userId}:favorites:*`,
      `user:${userId}:history:*`,
      `user:profile:${userId}`,
    ];

    for (const pattern of patterns) {
      const keys = this.generateCommonKeys(pattern, userId);
      for (const key of keys) {
        try {
          await this.del(key);
        } catch (error) {
          console.warn(`Failed to delete cache key: ${key}`, error);
        }
      }
    }
  }

  private generateCommonKeys(pattern: string, userId: string): string[] {
    const keys: string[] = [];

    if (pattern.includes('favorites')) {
      for (let page = 1; page <= 10; page++) {
        for (const limit of [10, 20, 50]) {
          keys.push(`user:${userId}:favorites:${page}:${limit}`);
        }
      }
    }

    if (pattern.includes('history')) {
      for (let page = 1; page <= 10; page++) {
        for (const limit of [10, 20, 50]) {
          keys.push(`user:${userId}:history:${page}:${limit}`);
        }
      }
    }

    if (pattern.includes('profile')) {
      keys.push(`user:profile:${userId}`);
    }

    return keys;
  }
}
