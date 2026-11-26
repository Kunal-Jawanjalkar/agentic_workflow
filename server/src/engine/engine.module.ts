import { Module } from '@nestjs/common'

import { NodesModule } from '../nodes/nodes.module'

import { TemporalService } from './temporal.service'

@Module({
  imports: [NodesModule],
  providers: [TemporalService],
  exports: [TemporalService],
})
export class EngineModule {}
