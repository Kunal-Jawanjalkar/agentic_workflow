import { FastifyReply } from 'fastify'

export const ACCESS_TOKEN_COOKIE_NAME = 'access_token'

type CookieSettings = {
  accessTokenExpireMinutes: number
  cookieSecure: boolean
}

export function setAccessTokenCookie(
  reply: FastifyReply,
  token: string,
  settings: CookieSettings,
): void {
  void reply.setCookie(ACCESS_TOKEN_COOKIE_NAME, token, {
    maxAge: settings.accessTokenExpireMinutes * 60,
    httpOnly: true,
    secure: settings.cookieSecure,
    sameSite: 'lax',
    path: '/',
  })
}

export function clearAccessTokenCookie(reply: FastifyReply, settings: CookieSettings): void {
  void reply.clearCookie(ACCESS_TOKEN_COOKIE_NAME, {
    path: '/',
    secure: settings.cookieSecure,
    httpOnly: true,
    sameSite: 'lax',
  })
}