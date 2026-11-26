import { Module } from '@nestjs/common'

import { NodesModule } from '../nodes/nodes.module'

import { NodeTypesController } from './node-types.controller'
import { NodeTypesService } from './node-types.service'

@Module({
  imports: [NodesModule],
  controllers: [NodeTypesController],
  providers: [NodeTypesService],
})
export class NodeTypesModule {}