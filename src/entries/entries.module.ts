import { Module } from '@nestjs/common';
import { EntriesService } from './entries.service';
import { EntriesController } from './entries.controller';
import { PrismaModule } from 'src/shared/prisma.module';
import { HttpModule } from '@nestjs/axios';
import { CacheService } from '../shared/cache.service';

@Module({
  imports: [PrismaModule, HttpModule],
  providers: [EntriesService, CacheService],
  controllers: [EntriesController],
  exports: [EntriesService],
})
export class EntriesModule {}
