import nodeTypesSnapshot from '../../../node-types.json'

export type NodeTypeDescriptor = {
  type: string
  version: number
  label: string
  category: string
  icon: string
  outputs: string[]
  config_schema: Record<string, unknown>
}

type NodeTypesFile = {
  node_types: NodeTypeDescriptor[]
}

const snapshot = nodeTypesSnapshot as NodeTypesFile

export const NODE_TYPE_DESCRIPTORS: NodeTypeDescriptor[] = snapshot.node_types