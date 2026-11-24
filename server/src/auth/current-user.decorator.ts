import { createParamDecorator, ExecutionContext } from '@nestjs/common'

import { AuthenticatedRequest } from './cookie-auth.guard'
import { UserPublicDto } from './auth.types'

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UserPublicDto => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>()
    if (request.user == null) {
      throw new Error('CurrentUser used without CookieAuthGuard')
    }
    return request.user
  },
)