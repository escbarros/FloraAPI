import { Body, Controller, Post } from '@nestjs/common';
import { AuthSignUpRequestSchema } from './dto/auth-signup-request-dto';
import { AuthService } from './auth.service';
import { AuthResponseDto } from './dto/auth-response-dto';
import { AuthSignInRequestSchema } from './dto/auth-signin-request-dto';
import { ApiTags } from '@nestjs/swagger';
import { SwaggerSignupEndpoint } from './decorators/swagger-signup-endpoint.decorator';
import { SwaggerSigninEndpoint } from './decorators/swagger-signin-endpoint.decorator';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @SwaggerSignupEndpoint()
  async signup(@Body() body: any) {
    const parseResult = AuthSignUpRequestSchema.parse(body);
    const response = await this.authService.signup(parseResult);
    const token = this.authService.generateJwt(response);
    return new AuthResponseDto(response.id, response.name, token);
  }

  @Post('signin')
  @SwaggerSigninEndpoint()
  async signin(@Body() body: any) {
    const parseResult = AuthSignInRequestSchema.parse(body);
    const response = await this.authService.signin(parseResult);
    const token = this.authService.generateJwt(response);
    return new AuthResponseDto(response.id, response.name, token);
  }
}
