import {
  HttpStatus,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Client, Connection, ScheduleOverlapPolicy } from '@temporalio/client'
import { NativeConnection, Worker } from '@temporalio/worker'

import { HttpDetailException } from '../common/http-detail.exception'
import { EnvironmentVariables } from '../config/env'
import { NodeRegistryService } from '../nodes/node-registry.service'
import { PrismaService } from '../prisma/prisma.service'

import { createWorkflowActivities } from './temporal/activities'
import type { WorkflowGraphExecutionInput, WorkflowGraphPayload } from './temporal/workflow'

@Injectable()
export class TemporalService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TemporalService.name)
  private readonly address: string
  private readonly namespace: string
  private readonly taskQueue: string

  private clientConnection: Connection | null = null
  private client: Client | null = null
  private workerConnection: NativeConnection | null = null
  private worker: Worker | null = null
  private workerRunPromise: Promise<void> | null = null

  constructor(
    private readonly config: ConfigService<EnvironmentVariables, true>,
    private readonly prisma: PrismaService,
    private readonly nodeRegistry: NodeRegistryService,
  ) {
    this.address = this.config.get('TEMPORAL_ADDRESS', { infer: true })
    this.namespace = this.config.get('TEMPORAL_NAMESPACE', { infer: true })
    this.taskQueue = this.config.get('TEMPORAL_TASK_QUEUE', { infer: true })
  }

  async onModuleInit(): Promise<void> {
    if (process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined) {
      return
    }
    try {
      await this.ensureClient()
      await this.startWorker()
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.logger.warn(
        `Temporal unavailable at ${this.address} (${message}). Worker will retry when workflows run.`,
      )
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.worker) {
      this.worker.shutdown()
      await this.workerRunPromise?.catch(() => undefined)
      this.worker = null
    }
    if (this.workerConnection) {
      await this.workerConnection.close().catch(() => undefined)
      this.workerConnection = null
    }
    if (this.clientConnection) {
      await this.clientConnection.close().catch(() => undefined)
      this.clientConnection = null
    }
    this.client = null
  }

  private async ensureClient(): Promise<Client> {
    if (this.client) {
      return this.client
    }
    this.clientConnection = await Connection.connect({ address: this.address })
    this.client = new Client({
      connection: this.clientConnection,
      namespace: this.namespace,
    })
    return this.client
  }

  private async startWorker(): Promise<void> {
    if (this.worker) {
      return
    }
    this.workerConnection = await NativeConnection.connect({ address: this.address })
    this.worker = await Worker.create({
      connection: this.workerConnection,
      namespace: this.namespace,
      taskQueue: this.taskQueue,
      workflowsPath: require.resolve('./temporal/workflow'),
      activities: createWorkflowActivities(this.prisma, this.nodeRegistry),
    })
    this.workerRunPromise = this.worker.run().catch((error: unknown) => {
      this.logger.error('Temporal worker exited unexpectedly', error)
    })
    this.logger.log(`Temporal worker listening on task queue "${this.taskQueue}"`)
  }

  async startWorkflowRun(
    input: WorkflowGraphExecutionInput,
  ): Promise<{ temporalWorkflowId: string; temporalRunId: string }> {
    try {
      const client = await this.ensureClient()
      await this.startWorker()
      const handle = await client.workflow.start('executeWorkflowGraph', {
        taskQueue: this.taskQueue,
        workflowId: `wf-run-${input.runId}`,
        args: [input],
      })
      return {
        temporalWorkflowId: handle.workflowId,
        temporalRunId: handle.firstExecutionRunId,
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      throw new HttpDetailException(
        HttpStatus.SERVICE_UNAVAILABLE,
        `Could not start Temporal workflow: ${message}`,
      )
    }
  }

  async syncSchedule(params: {
    ownerId: string
    workflowId: string
    workflowVersionId: string
    graph: WorkflowGraphPayload
    cron: string
    timezone: string
  }): Promise<{ scheduleId: string }> {
    const scheduleId = `wf-schedule-${params.workflowId}`
    try {
      const client = await this.ensureClient()
      await this.startWorker()
      const scheduleOptions = {
        scheduleId,
        spec: {
          cronExpressions: [params.cron],
          timezone: params.timezone,
        },
        action: {
          type: 'startWorkflow' as const,
          workflowType: 'executeWorkflowGraph',
          taskQueue: this.taskQueue,
          args: [
            {
              ownerId: params.ownerId,
              workflowId: params.workflowId,
              workflowVersionId: params.workflowVersionId,
              triggerType: 'scheduler',
              graph: params.graph,
              triggerInput: {
                cron: params.cron,
                timezone: params.timezone,
              },
            },
          ],
        },
        policies: {
          overlap: ScheduleOverlapPolicy.SKIP,
        },
      }

      try {
        const existing = client.schedule.getHandle(scheduleId)
        await existing.describe()
        await existing.update((previous) => ({
          ...previous,
          spec: scheduleOptions.spec,
          action: scheduleOptions.action,
        }))
      } catch {
        await client.schedule.create(scheduleOptions)
      }

      return { scheduleId }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      throw new HttpDetailException(
        HttpStatus.SERVICE_UNAVAILABLE,
        `Could not sync Temporal schedule: ${message}`,
      )
    }
  }

  async deleteSchedule(workflowId: string): Promise<void> {
    const scheduleId = `wf-schedule-${workflowId}`
    try {
      const client = await this.ensureClient()
      const handle = client.schedule.getHandle(scheduleId)
      await handle.delete()
    } catch {
      // Schedule does not exist or Temporal is offline; ignore on delete.
    }
  }
}
