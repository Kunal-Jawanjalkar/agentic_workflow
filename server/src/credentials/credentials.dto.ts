import { IsObject, IsOptional, IsString, Length } from 'class-validator'

export class CreateCredentialDto {
  @IsString()
  @Length(1, 200)
  name!: string

  @IsString()
  @Length(1, 100)
  provider!: string

  @IsObject()
  secret!: Record<string, unknown>
}

export class UpdateCredentialDto {
  @IsOptional()
  @IsString()
  @Length(1, 200)
  name?: string

  @IsOptional()
  @IsString()
  @Length(1, 100)
  provider?: string

  @IsOptional()
  @IsObject()
  secret?: Record<string, unknown>
}
