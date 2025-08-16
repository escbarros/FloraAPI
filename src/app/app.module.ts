import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthController } from '../auth/auth.controller';
import { AuthModule } from '../auth/auth.module';
import { UserController } from 'src/user/user.controller';
import { EntriesController } from 'src/entries/entries.controller';
import { EntriesModule } from 'src/entries/entries.module';

@Module({
  controllers: [
    AppController,
    AuthController,
    UserController,
    EntriesController,
  ],
  providers: [AppService],
  imports: [AuthModule, EntriesModule],
})
export class AppModule {}
