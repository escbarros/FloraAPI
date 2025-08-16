import {
  Controller,
  Get,
  Query,
  Request,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtGuard } from '../shared/middleware/jwt.guard';
import { ConditionalCacheInterceptor } from '../shared/interceptors/conditional-cache.interceptor';
import { Cacheable } from '../shared/decorators/cacheable.decorator';
import type { RequestWithUser } from '../shared/types/JwtRequest';
import { UserService } from './user.service';
import { UserListPaginationRequestSchema } from './dto/user-list-pagination-request-dto';
import { SwaggerUserHistoryEndpoint } from './decorators/swagger-user-history-endpoint.decorator';
import { SwaggerUserFavoritesEndpoint } from './decorators/swagger-user-favorites-endpoint.decorator';
import { SwaggerUserProfileEndpoint } from './decorators/swagger-user-profile-endpoint.decorator';

@ApiTags('User')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtGuard)
@UseInterceptors(ConditionalCacheInterceptor)
@Cacheable({ ttl: 300, keyPrefix: 'user' })
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('/me')
  @SwaggerUserProfileEndpoint()
  async getUserProfile(@Request() req: RequestWithUser) {
    const { sub: userId } = req.user;
    const userProfile = await this.userService.getUserProfile(userId);
    return userProfile;
  }

  @Get('/me/history')
  @SwaggerUserHistoryEndpoint()
  async getUserHistory(
    @Request() req: RequestWithUser,
    @Query('limit') limit?: string,
    @Query('page') page?: string,
  ) {
    const { sub: userId } = req.user;
    const parseResult = UserListPaginationRequestSchema.parse({
      userId,
      limit,
      page,
    });
    const userHistory = await this.userService.getUserHistory(parseResult);
    return userHistory;
  }

  @Get('/me/favorites')
  @SwaggerUserFavoritesEndpoint()
  async getUserFavorites(
    @Request() req: RequestWithUser,
    @Query('limit') limit?: string,
    @Query('page') page?: string,
  ) {
    const { sub: userId } = req.user;
    const parseResult = UserListPaginationRequestSchema.parse({
      userId,
      limit,
      page,
    });
    const userFavorites = await this.userService.getUserFavorites(parseResult);
    return userFavorites;
  }
}
