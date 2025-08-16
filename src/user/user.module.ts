import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PrismaModule } from '../shared/prisma.module';
import { CacheService } from '../shared/cache.service';

@Module({
  imports: [PrismaModule],
  providers: [UserService, CacheService],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
