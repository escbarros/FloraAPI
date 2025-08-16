import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtGuard } from '../shared/middleware/jwt.guard';
import type { RequestWithUser } from '../shared/types/JwtRequest';
import { UserService } from './user.service';
import { UserHistoryRequestSchema } from './dto/user-history-request-dto';
import { SwaggerUserHistoryEndpoint } from './decorators/swagger-user-history-endpoint.decorator';

@ApiTags('User')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtGuard)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}
  @Get('/history')
  @SwaggerUserHistoryEndpoint()
  async getUserHistory(
    @Request() req: RequestWithUser,
    @Query('limit') limit?: string,
    @Query('page') page?: string,
  ) {
    const { sub: userId } = req.user;
    const parseResult = UserHistoryRequestSchema.parse({
      userId,
      limit,
      page,
    });
    const userHistory = await this.userService.getUserHistory(parseResult);
    return userHistory;
  }
}
