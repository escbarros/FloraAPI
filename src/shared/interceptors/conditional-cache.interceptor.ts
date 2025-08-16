import {
  Injectable,
  CallHandler,
  ExecutionContext,
  NestInterceptor,
  Inject,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Reflector } from '@nestjs/core';
import type { Cache } from 'cache-manager';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import type { Request, Response } from 'express';
import {
  CACHEABLE_METADATA,
  type CacheableOptions,
} from '../decorators/cacheable.decorator';

@Injectable()
export class ConditionalCacheInterceptor implements NestInterceptor {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private reflector: Reflector,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    const cacheOptions = this.reflector.get<CacheableOptions>(
      CACHEABLE_METADATA,
      context.getClass(),
    );

    if (!cacheOptions || request.method !== 'GET') {
      return next.handle();
    }

    const key = this.generateCacheKey(request, cacheOptions.keyPrefix);
    const ttl = cacheOptions.ttl || 300;
    const start = Date.now();

    try {
      const cached = await this.cacheManager.get(key);

      if (cached) {
        response.setHeader('x-cache', 'HIT');
        response.setHeader('x-cache-key', key);
        response.setHeader('x-response-time', `${Date.now() - start}ms`);
        return of(cached);
      }

      return next.handle().pipe(
        tap((data) => {
          this.cacheManager.set(key, data, ttl * 1000).catch(console.error);
          response.setHeader('x-cache', 'MISS');
          response.setHeader('x-cache-key', key);
          response.setHeader('x-response-time', `${Date.now() - start}ms`);
        }),
      );
    } catch (error) {
      console.error('Cache error:', error);
      response.setHeader('x-cache', 'ERROR');
      response.setHeader('x-response-time', `${Date.now() - start}ms`);
      return next.handle();
    }
  }

  private generateCacheKey(
    request: Request & { user?: { id: string } },
    prefix?: string,
  ): string {
    const pathParts = request.url.split('/');
    const controllerName = pathParts[1] || 'unknown';
    let key: string = prefix || controllerName;

    key += `:${request.originalUrl.split('?')[0]}`;

    if (request.query && Object.keys(request.query).length > 0) {
      const sortedQuery = Object.keys(request.query)
        .sort()
        .reduce(
          (result, queryKey) => {
            result[queryKey] = request.query[queryKey];
            return result;
          },
          {} as Record<string, any>,
        );

      const queryString = new URLSearchParams(sortedQuery).toString();
      key += `?${queryString}`;
    }

    if (request.user?.id) {
      key += `:user:${request.user.id}`;
    }

    return key;
  }
}
