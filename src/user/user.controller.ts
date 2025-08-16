import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtGuard } from '../shared/middleware/jwt.guard';
import type { RequestWithUser } from '../shared/types/JwtRequest';

@ApiTags('User')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtGuard)
@Controller('user')
export class UserController {
  @Get('/me')
  getUser(@Request() req: RequestWithUser) {
    const { sub: id } = req.user;
    return { message: 'User endpoint', user: id };
  }
}
