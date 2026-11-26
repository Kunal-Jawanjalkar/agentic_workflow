import { Module } from '@nestjs/common'

import { AuthModule } from '../auth/auth.module'
import { EngineModule } from '../engine/engine.module'
import { NodesModule } from '../nodes/nodes.module'

import { RunsController } from './runs.controller'
import { RunsService } from './runs.service'

@Module({
  imports: [AuthModule, EngineModule, NodesModule],
  controllers: [RunsController],
  providers: [RunsService],
})
export class RunsModule {}
