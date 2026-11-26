import { plainToInstance } from 'class-transformer'
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Min,
  validateSync,
} from 'class-validator'

export class EnvironmentVariables {
  @IsString()
  @IsNotEmpty()
  DATABASE_URL!: string

  @IsString()
  @IsNotEmpty()
  SECRET_KEY!: string

  @IsString()
  @Matches(/^[\da-f]{64}$/i)
  CREDENTIALS_ENCRYPTION_KEY!: string

  @IsInt()
  @Min(1)
  ACCESS_TOKEN_EXPIRE_MINUTES!: number

  @IsString()
  @IsOptional()
  CORS_ORIGINS = 'http://localhost:5173'

  @IsBoolean()
  @IsOptional()
  COOKIE_SECURE = false

  @IsInt()
  @IsOptional()
  PORT = 8001

  @IsString()
  @IsOptional()
  TEMPORAL_ADDRESS = 'localhost:7233'

  @IsString()
  @IsOptional()
  TEMPORAL_NAMESPACE = 'default'

  @IsString()
  @IsOptional()
  TEMPORAL_TASK_QUEUE = 'agentic-workflow'
}

export function validateEnv(config: Record<string, unknown>): EnvironmentVariables {
  const raw = {
    ...config,
    ACCESS_TOKEN_EXPIRE_MINUTES: Number(config.ACCESS_TOKEN_EXPIRE_MINUTES ?? 10080),
    COOKIE_SECURE: config.COOKIE_SECURE === 'true' || config.COOKIE_SECURE === true,
    PORT: Number(config.PORT),
  }
  const validated = plainToInstance(EnvironmentVariables, raw, {
    enableImplicitConversion: true,
  })
  const errors = validateSync(validated, { skipMissingProperties: false })
  if (errors.length > 0) {
    throw new Error(errors.toString())
  }
  return validated
}

export function corsOriginList(origins: string): string[] {
  return origins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
}