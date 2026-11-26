import { Test, TestingModule } from '@nestjs/testing'

import { CredentialsService } from '../credentials/credentials.service'
import { LlmNodeExecutor } from '../nodes/llm-node'
import { NodeRegistryService } from '../nodes/node-registry.service'
import { TriggerNodeExecutor } from '../nodes/trigger-node'

import { NodeTypesService } from './node-types.service'

describe('NodeTypesService', () => {
  let service: NodeTypesService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NodeTypesService,
        NodeRegistryService,
        TriggerNodeExecutor,
        LlmNodeExecutor,
        { provide: CredentialsService, useValue: {} },
      ],
    }).compile()

    service = module.get<NodeTypesService>(NodeTypesService)
  })

  it('returns node_types starting with the code-registered trigger descriptor', () => {
    const { node_types } = service.list()
    const trigger = node_types.find((node) => node.type === 'trigger')

    expect(trigger).toBeDefined()
    expect(trigger?.config_schema).toMatchObject({
      properties: {
        trigger_type: {
          type: 'string',
          enum: ['manual', 'webhook', 'scheduler'],
          default: 'manual',
        },
      },
    })
  })
})
