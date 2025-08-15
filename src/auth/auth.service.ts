import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { AuthSignUpRequestDto } from './dto/auth-signup-request-dto';
import { User } from '@prisma/client';
import { PrismaService } from '../shared/prisma.service';
import bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { AuthSignInRequestDto } from './dto/auth-signin-request-dto';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async signup(data: AuthSignUpRequestDto): Promise<User> {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        password: hashedPassword,
      },
    });
    return user;
  }

  async signin(data: AuthSignInRequestDto): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user || !(await bcrypt.compare(data.password, user.password))) {
      throw new HttpException('invalid credentials', HttpStatus.UNAUTHORIZED);
    }

    return user;
  }

  generateJwt(user: { id: string; email: string }) {
    return jwt.sign(
      { sub: user.id, email: user.email },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '1d' },
    );
  }
}
