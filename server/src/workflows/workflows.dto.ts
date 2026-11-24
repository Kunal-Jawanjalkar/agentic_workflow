import { Type } from 'class-transformer'
import {
  IsArray,
  IsObject,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  ValidateNested,
} from 'class-validator'

export class WorkflowGraphDto {
  @IsArray()
  nodes!: Record<string, unknown>[]

  @IsArray()
  edges!: Record<string, unknown>[]
}

export class CreateWorkflowDto {
  @IsString()
  @Length(1, 200)
  @IsOptional()
  name = 'Untitled workflow'

  @IsOptional()
  @IsString()
  description: string | null = null
}

export class UpdateWorkflowDto {
  @IsOptional()
  @IsString()
  @Length(1, 200)
  name?: string

  @IsOptional()
  @IsString()
  description?: string | null

  @IsOptional()
  @ValidateNested()
  @Type(() => WorkflowGraphDto)
  graph?: WorkflowGraphDto
}