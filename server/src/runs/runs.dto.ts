import { IsBoolean, IsObject, IsOptional } from 'class-validator'

export class TriggerManualRunDto {
  @IsOptional()
  @IsObject()
  input?: Record<string, unknown>

  @IsOptional()
  @IsBoolean()
  test_mode?: boolean
}
