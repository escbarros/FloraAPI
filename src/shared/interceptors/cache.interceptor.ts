import {
  Injectable,
  CallHandler,
  ExecutionContext,
  NestInterceptor,
  Inject,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import type { Request, Response } from 'express';

export const CACHE_KEY_METADATA = 'cache_key';
export const CACHE_TTL_METADATA = 'cache_ttl';

@Injectable()
export class CustomCacheInterceptor implements NestInterceptor {
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

    const cacheKey = this.reflector.get<string>(
      CACHE_KEY_METADATA,
      context.getHandler(),
    );

    const cacheTTL = this.reflector.get<number>(
      CACHE_TTL_METADATA,
      context.getHandler(),
    );

    if (!cacheKey) {
      return next.handle();
    }

    const key = this.buildCacheKey(cacheKey, request);
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
          const ttl = cacheTTL || 300;
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

  private buildCacheKey(
    template: string,
    request: Request & { user?: { id: string } },
  ): string {
    let key = template;

    if (request.params) {
      Object.keys(request.params).forEach((param) => {
        key = key.replace(`:${param}`, request.params[param]);
      });
    }

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
      key = key.replace(':userId', request.user.id);
    }

    return key;
  }
}
