import { SetMetadata } from '@nestjs/common';

export const CACHEABLE_METADATA = 'cacheable';

export interface CacheableOptions {
  ttl?: number;
  keyPrefix?: string;
}

export const Cacheable = (options?: CacheableOptions) =>
  SetMetadata(CACHEABLE_METADATA, options || {});
