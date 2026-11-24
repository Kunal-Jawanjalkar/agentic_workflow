import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'

import { EnvironmentVariables } from '../config/env'

export const JWT_ALGORITHM = 'HS256'

@Injectable()
export class SecurityService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService<EnvironmentVariables, true>,
  ) {}

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12)
  }

  async verifyPassword(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain, hashed)
  }

  createAccessToken(subject: string): string {
    const expiresMinutes = this.config.get('ACCESS_TOKEN_EXPIRE_MINUTES', { infer: true })
    return this.jwtService.sign(
    { sub: subject },
    {
      secret: this.config.get('SECRET_KEY', { infer: true }),
      expiresIn: `${expiresMinutes}m`,
    },
  )
  }

  verifyAccessToken(token: string): { sub: string } {
    const payload = this.jwtService.verify<{ sub: string }>(token, {
      secret: this.config.get('SECRET_KEY', { infer: true }),
      algorithms: [JWT_ALGORITHM],
    })
    return payload
  }
}