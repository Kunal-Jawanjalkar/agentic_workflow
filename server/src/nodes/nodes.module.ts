import { Module } from '@nestjs/common'

import { CredentialsModule } from '../credentials/credentials.module'

import { LlmNodeExecutor } from './llm-node'
import { NodeRegistryService } from './node-registry.service'
import { TriggerNodeExecutor } from './trigger-node'

@Module({
  imports: [CredentialsModule],
  providers: [TriggerNodeExecutor, LlmNodeExecutor, NodeRegistryService],
  exports: [TriggerNodeExecutor, LlmNodeExecutor, NodeRegistryService],
})
export class NodesModule {}
