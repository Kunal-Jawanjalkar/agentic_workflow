import { Injectable } from '@nestjs/common'
import { Prisma } from '../generated/prisma/client'

import { HttpDetailException } from '../common/http-detail.exception'
import { PrismaService } from '../prisma/prisma.service'

import { LoginDto, RegisterDto, UserPublicDto } from './auth.types'
import { SecurityService } from './security.service'

function toUserPublic(user: {
  id: string
  email: string
  first_name: string
  last_name: string
  created_at: Date
}): UserPublicDto {
  return {
    id: user.id,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    created_at: user.created_at.toISOString(),
  }
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly security: SecurityService,
  ) {}

  async register(body: RegisterDto): Promise<UserPublicDto> {
    const email = body.email.toLowerCase()
    const hashedPassword = await this.security.hashPassword(body.password)
    try {
      const user = await this.prisma.user.create({
        data: {
          email,
          first_name: body.first_name.trim(),
          last_name: body.last_name.trim(),
          hashed_password: hashedPassword,
        },
      })
      return toUserPublic(user)
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new HttpDetailException(409, 'An account with this email already exists')
      }
      throw error
    }
  }

  async login(body: LoginDto): Promise<{ user: UserPublicDto; token: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email: body.email.toLowerCase() },
    })
    if (
      user == null ||
      !user.is_active ||
      !(await this.security.verifyPassword(body.password, user.hashed_password))
    ) {
      throw new HttpDetailException(401, 'Incorrect email or password')
    }
    const token = this.security.createAccessToken(user.id)
    return { user: toUserPublic(user), token }
  }

  async getUserById(userId: string): Promise<UserPublicDto | null> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (user == null || !user.is_active) {
      return null
    }
    return toUserPublic(user)
  }
}