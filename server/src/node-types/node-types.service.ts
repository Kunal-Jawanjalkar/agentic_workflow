import { Injectable } from '@nestjs/common'

import { NODE_TYPE_DESCRIPTORS } from '../nodes/node-type-descriptors'

@Injectable()
export class NodeTypesService {
  list() {
    return { node_types: NODE_TYPE_DESCRIPTORS }
  }
}