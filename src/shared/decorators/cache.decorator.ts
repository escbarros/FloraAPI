import { SetMetadata } from '@nestjs/common';
import {
  CACHE_KEY_METADATA,
  CACHE_TTL_METADATA,
} from '../interceptors/cache.interceptor';

export const CacheKey = (key: string) => SetMetadata(CACHE_KEY_METADATA, key);
export const CacheTTL = (ttl: number) => SetMetadata(CACHE_TTL_METADATA, ttl);

export const Cache = (key: string, ttl: number = 300) => {
  return (
    target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) => {
    CacheKey(key)(target, propertyKey, descriptor);
    CacheTTL(ttl)(target, propertyKey, descriptor);
  };
};
