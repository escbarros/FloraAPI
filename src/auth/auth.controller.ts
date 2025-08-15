import { Body, Controller, Post } from '@nestjs/common';
import { AuthSignUpRequestSchema } from './dto/auth-signup-request-dto';
import { AuthService } from './auth.service';
import { AuthResponseDto } from './dto/auth-response-dto';
import { AuthSignInRequestSchema } from './dto/auth-signin-request-dto';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Post('signup')
  @ApiOperation({
    summary: 'User registration',
    description: 'Register a new user with email, name and password',
  })
  @ApiBody({
    description: 'User registration data',
    schema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          format: 'email',
          example: 'user@example.com',
        },
        name: {
          type: 'string',
          example: 'John Doe',
        },
        password: {
          type: 'string',
          minLength: 6,
          example: 'password123',
        },
      },
      required: ['email', 'name', 'password'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'uuid-string' },
        name: { type: 'string', example: 'John Doe' },
        token: { type: 'string', example: 'jwt-token-string' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid input data',
  })
  async signup(@Body() body: any) {
    const parseResult = AuthSignUpRequestSchema.parse(body);
    const response = await this.authService.signup(parseResult);
    const token = this.authService.generateJwt(response);
    return new AuthResponseDto(response.id, response.name, token);
  }

  @Post('signin')
  async signin(@Body() body: any) {
    console.log(body);
    const parseResult = AuthSignInRequestSchema.parse(body);
    const response = await this.authService.signin(parseResult);
    const token = this.authService.generateJwt(response);
    return new AuthResponseDto(response.id, response.email, token);
  }
}
