import { IsEmail, IsString, Length, MinLength } from 'class-validator'

export class RegisterDto {
  @IsEmail()
  email!: string

  @IsString()
  @MinLength(8)
  @Length(8, 128)
  password!: string

  @IsString()
  @Length(1, 100)
  first_name!: string

  @IsString()
  @Length(1, 100)
  last_name!: string
}

export class LoginDto {
  @IsEmail()
  email!: string

  @IsString()
  @Length(1, 128)
  password!: string
}

export type UserPublicDto = {
  id: string
  email: string
  first_name: string
  last_name: string
  created_at: string
}