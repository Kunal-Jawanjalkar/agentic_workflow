import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { FastifyRequest } from 'fastify'

import { HttpDetailException } from '../common/http-detail.exception'

import { ACCESS_TOKEN_COOKIE_NAME } from './cookies'
import { AuthService } from './auth.service'
import { SecurityService } from './security.service'

export type AuthenticatedRequest = FastifyRequest & {
  user?: Awaited<ReturnType<AuthService['getUserById']>>
}

@Injectable()
export class CookieAuthGuard implements CanActivate {
  constructor(
    private readonly security: SecurityService,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()
    const token = request.cookies?.[ACCESS_TOKEN_COOKIE_NAME]
    if (!token) {
      throw new HttpDetailException(401, 'Not authenticated')
    }

    let userId: string
    try {
      userId = this.security.verifyAccessToken(token).sub
    } catch {
      throw new HttpDetailException(401, 'Invalid or expired session')
    }

    const user = await this.authService.getUserById(userId)
    if (user == null) {
      throw new HttpDetailException(401, 'Not authenticated')
    }
    request.user = user
    return true
  }
}