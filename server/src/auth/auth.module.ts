import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'

import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { CookieAuthGuard } from './cookie-auth.guard'
import { SecurityService } from './security.service'

@Module({
  imports: [JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, SecurityService, CookieAuthGuard],
  exports: [AuthService, SecurityService, CookieAuthGuard],
})
export class AuthModule {}