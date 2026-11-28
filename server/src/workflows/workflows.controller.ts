import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common'

import { CookieAuthGuard } from '../auth/cookie-auth.guard'
import { CurrentUser } from '../auth/current-user.decorator'
import { UserPublicDto } from '../auth/auth.types'

import { CreateWorkflowDto, UpdateWorkflowDto } from './workflows.dto'
import { WorkflowsService } from './workflows.service'

@Controller('api/v1/workflows')
@UseGuards(CookieAuthGuard)
export class WorkflowsController {
  constructor(private readonly workflowsService: WorkflowsService) {}

  @Get()
  list(@CurrentUser() user: UserPublicDto) {
    return this.workflowsService.listForOwner(user.id)
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser() user: UserPublicDto, @Body() body: CreateWorkflowDto) {
    return this.workflowsService.createDraft(user.id, body)
  }

  @Get(':workflowId')
  get(
    @CurrentUser() user: UserPublicDto,
    @Param('workflowId', ParseUUIDPipe) workflowId: string,
  ) {
    return this.workflowsService.getForOwner(user.id, workflowId)
  }

  @Patch(':workflowId')
  patch(
    @CurrentUser() user: UserPublicDto,
    @Param('workflowId', ParseUUIDPipe) workflowId: string,
    @Body() body: UpdateWorkflowDto,
  ) {
    return this.workflowsService.updateDraft(user.id, workflowId, body)
  }

  @Post(':workflowId/publish')
  @HttpCode(HttpStatus.OK)
  publish(
    @CurrentUser() user: UserPublicDto,
    @Param('workflowId', ParseUUIDPipe) workflowId: string,
  ) {
    return this.workflowsService.publishWorkflow(user.id, workflowId)
  }
}