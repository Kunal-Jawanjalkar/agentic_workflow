import { Injectable } from '@nestjs/common'

import { NodeRegistryService } from '../nodes/node-registry.service'

@Injectable()
export class NodeTypesService {
  constructor(private readonly nodeRegistry: NodeRegistryService) {}

  list() {
    return { node_types: this.nodeRegistry.listDescriptors() }
  }
}