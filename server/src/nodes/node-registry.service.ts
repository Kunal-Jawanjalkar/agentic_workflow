import { HttpStatus, Injectable } from '@nestjs/common'

import { HttpDetailException } from '../common/http-detail.exception'

import { LlmNodeExecutor } from './llm-node'
import { NODE_TYPE_DESCRIPTORS } from './node-type-descriptors'
import { NodeExecutor, NodeTypeDescriptor } from './node.types'
import { TriggerNodeExecutor } from './trigger-node'

function executorKey(type: string, version: number): string {
  return `${type}@${version}`
}

@Injectable()
export class NodeRegistryService {
  private readonly executors = new Map<string, NodeExecutor<unknown>>()
  private readonly descriptors: NodeTypeDescriptor[]

  constructor(
    triggerNode: TriggerNodeExecutor,
    llmNode: LlmNodeExecutor,
  ) {
    const registered: NodeExecutor<unknown>[] = [triggerNode, llmNode]

    for (const executor of registered) {
      const { type, version } = executor.descriptor
      this.executors.set(executorKey(type, version), executor)
    }

    const registeredTypes = new Set(registered.map((executor) => executor.descriptor.type))
    const fallbackDescriptors = NODE_TYPE_DESCRIPTORS.filter(
      (descriptor) => !registeredTypes.has(descriptor.type),
    )

    this.descriptors = [
      ...registered.map((executor) => executor.descriptor),
      ...fallbackDescriptors,
    ]
  }

  listDescriptors(): NodeTypeDescriptor[] {
    return this.descriptors
  }

  getExecutor(type: string, version = 1): NodeExecutor<unknown> | undefined {
    return this.executors.get(executorKey(type, version))
  }

  getExecutorOrThrow(type: string, version = 1): NodeExecutor<unknown> {
    const executor = this.getExecutor(type, version)
    if (!executor) {
      throw new HttpDetailException(
        HttpStatus.BAD_REQUEST,
        `Unsupported node type "${type}" (v${version})`,
      )
    }
    return executor
  }

  hasExecutor(type: string, version = 1): boolean {
    return this.executors.has(executorKey(type, version))
  }
}
