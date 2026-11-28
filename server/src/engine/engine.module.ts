import { BullModule } from '@nestjs/bullmq'
import { Module } from '@nestjs/common'

import { NodesModule } from '../nodes/nodes.module'

import { WORKFLOW_NODES_QUEUE, WORKFLOW_SCHEDULES_QUEUE } from './queue.constants'
import { WorkflowNodeProcessor } from './workflow-node.processor'
import { WorkflowQueueService } from './workflow-queue.service'
import { WorkflowScheduleProcessor } from './workflow-schedule.processor'

const workerEnabled =
  process.env.WORKER_ENABLED !== 'false' &&
  process.env.NODE_ENV !== 'test' &&
  process.env.JEST_WORKER_ID === undefined

@Module({
  imports: [
    NodesModule,
    BullModule.registerQueue(
      { name: WORKFLOW_NODES_QUEUE },
      { name: WORKFLOW_SCHEDULES_QUEUE },
    ),
  ],
  providers: [
    WorkflowQueueService,
    ...(workerEnabled ? [WorkflowNodeProcessor, WorkflowScheduleProcessor] : []),
  ],
  exports: [WorkflowQueueService],
})
export class EngineModule {}
