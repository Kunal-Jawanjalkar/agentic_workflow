import { Module } from '@nestjs/common'

import { AuthModule } from '../auth/auth.module'
import { EngineModule } from '../engine/engine.module'
import { NodesModule } from '../nodes/nodes.module'

import { WorkflowsController } from './workflows.controller'
import { WorkflowsService } from './workflows.service'

@Module({
  imports: [AuthModule, NodesModule, EngineModule],
  controllers: [WorkflowsController],
  providers: [WorkflowsService],
})
export class WorkflowsModule {}
