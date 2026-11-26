import {
  All,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common'
import { FastifyRequest } from 'fastify'

import { CookieAuthGuard } from '../auth/cookie-auth.guard'
import { CurrentUser } from '../auth/current-user.decorator'
import { UserPublicDto } from '../auth/auth.types'

import { TriggerManualRunDto } from './runs.dto'
import { RunsService } from './runs.service'

@Controller('api/v1')
export class RunsController {
  constructor(private readonly runsService: RunsService) {}

  @Post('workflows/:workflowId/runs')
  @UseGuards(CookieAuthGuard)
  @HttpCode(HttpStatus.ACCEPTED)
  triggerManual(
    @CurrentUser() user: UserPublicDto,
    @Param('workflowId', ParseUUIDPipe) workflowId: string,
    @Body() body: TriggerManualRunDto,
  ) {
    return this.runsService.triggerManualRun(user.id, workflowId, body?.input ?? {})
  }

  @Get('workflows/:workflowId/runs')
  @UseGuards(CookieAuthGuard)
  listForWorkflow(
    @CurrentUser() user: UserPublicDto,
    @Param('workflowId', ParseUUIDPipe) workflowId: string,
  ) {
    return this.runsService.listRunsForOwner(user.id, workflowId)
  }

  @Post('workflows/:workflowId/schedule')
  @UseGuards(CookieAuthGuard)
  syncSchedule(
    @CurrentUser() user: UserPublicDto,
    @Param('workflowId', ParseUUIDPipe) workflowId: string,
  ) {
    return this.runsService.syncWorkflowSchedule(user.id, workflowId)
  }

  @Get('runs')
  @UseGuards(CookieAuthGuard)
  list(@CurrentUser() user: UserPublicDto) {
    return this.runsService.listRunsForOwner(user.id)
  }

  @Get('runs/:runId')
  @UseGuards(CookieAuthGuard)
  get(
    @CurrentUser() user: UserPublicDto,
    @Param('runId', ParseUUIDPipe) runId: string,
  ) {
    return this.runsService.getRunForOwner(user.id, runId)
  }

  @All('webhooks/:workflowId')
  @HttpCode(HttpStatus.ACCEPTED)
  webhook(
    @Param('workflowId', ParseUUIDPipe) workflowId: string,
    @Req() request: FastifyRequest,
    @Body() body: unknown,
  ) {
    const query =
      request.query && typeof request.query === 'object'
        ? (request.query as Record<string, unknown>)
        : {}
    const safeHeaders: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(request.headers)) {
      if (key !== 'cookie' && key !== 'authorization') {
        safeHeaders[key] = value
      }
    }
    return this.runsService.triggerWebhookRun(workflowId, {
      method: request.method,
      headers: safeHeaders,
      query,
      body,
    })
  }
}
