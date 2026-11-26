import { IsObject, IsOptional } from 'class-validator'

export class TriggerManualRunDto {
  @IsOptional()
  @IsObject()
  input?: Record<string, unknown>
}
