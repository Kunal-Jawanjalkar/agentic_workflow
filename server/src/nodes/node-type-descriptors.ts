import nodeTypesSnapshot from '../../../node-types.json'

import { NodeTypeDescriptor } from './node.types'

type NodeTypesFile = {
  node_types: NodeTypeDescriptor[]
}

const snapshot = nodeTypesSnapshot as NodeTypesFile

export const NODE_TYPE_DESCRIPTORS: NodeTypeDescriptor[] = snapshot.node_types
