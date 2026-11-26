import { Test, TestingModule } from '@nestjs/testing'

import { HttpDetailException } from '../common/http-detail.exception'
import { CredentialsService } from '../credentials/credentials.service'

import { LlmNodeExecutor } from './llm-node'
import { NodeRegistryService } from './node-registry.service'
import { TriggerNodeExecutor } from './trigger-node'

describe('NodeRegistryService', () => {
  let registry: NodeRegistryService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TriggerNodeExecutor,
        LlmNodeExecutor,
        NodeRegistryService,
        { provide: CredentialsService, useValue: {} },
      ],
    }).compile()

    registry = module.get<NodeRegistryService>(NodeRegistryService)
  })

  it('registers TriggerNodeExecutor and LlmNodeExecutor and lists all node descriptors', () => {
    const descriptors = registry.listDescriptors()

    expect(descriptors.map((item) => item.type)).toEqual([
      'trigger',
      'llm',
      'agent',
      'condition',
      'http',
      'approval',
      'notify',
    ])
  })

  it('resolves registered executors and rejects unsupported ones', () => {
    expect(registry.hasExecutor('trigger', 1)).toBe(true)
    expect(registry.getExecutor('trigger', 1)).toBeInstanceOf(TriggerNodeExecutor)
    expect(registry.hasExecutor('llm', 1)).toBe(true)
    expect(registry.getExecutor('llm', 1)).toBeInstanceOf(LlmNodeExecutor)
    expect(registry.hasExecutor('agent', 1)).toBe(false)
    expect(() => registry.getExecutorOrThrow('unknown', 1)).toThrow(HttpDetailException)
  })
})
