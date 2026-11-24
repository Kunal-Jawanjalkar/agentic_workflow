import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { FastifyReply } from 'fastify'

import { EnvironmentVariables } from '../config/env'

import { AuthService } from './auth.service'
import { LoginDto, RegisterDto, UserPublicDto } from './auth.types'
import { clearAccessTokenCookie, setAccessTokenCookie } from './cookies'
import { CookieAuthGuard } from './cookie-auth.guard'
import { CurrentUser } from './current-user.decorator'

@Controller('api/v1/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService<EnvironmentVariables, true>,
  ) {}

  private cookieSettings() {
    return {
      accessTokenExpireMinutes: this.config.get('ACCESS_TOKEN_EXPIRE_MINUTES', { infer: true }),
      cookieSecure: this.config.get('COOKIE_SECURE', { infer: true }),
    }
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() body: RegisterDto): Promise<UserPublicDto> {
    return this.authService.register(body)
  }

  @Post('login')
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<{ user: UserPublicDto }> {
    const result = await this.authService.login(body)
    setAccessTokenCookie(reply, result.token, this.cookieSettings())
    return { user: result.user }
  }

  @Get('me')
  @UseGuards(CookieAuthGuard)
  me(@CurrentUser() user: UserPublicDto): UserPublicDto {
    return user
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@Res({ passthrough: true }) reply: FastifyReply): void {
    clearAccessTokenCookie(reply, this.cookieSettings())
  }
}