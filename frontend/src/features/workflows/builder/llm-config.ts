import type { Edge, Node } from '@xyflow/react'

import { providerLabel, type CredentialRecord } from '@/features/credentials/api'
import type { BuilderNodeData } from '@/features/workflows/builder/types'

export type ProviderKey = 'openai' | 'anthropic' | 'google'

export const MODELS_BY_PROVIDER: Record<ProviderKey, { value: string; label: string }[]> = {
  openai: [
    { value: 'gpt-4o-mini', label: 'gpt-4o-mini' },
    { value: 'gpt-4o', label: 'gpt-4o' },
    { value: 'gpt-4.1-mini', label: 'gpt-4.1-mini' },
    { value: 'gpt-4.1', label: 'gpt-4.1' },
    { value: 'o4-mini', label: 'o4-mini' },
    { value: 'o3-mini', label: 'o3-mini' },
  ],
  anthropic: [
    { value: 'claude-sonnet-4-20250514', label: 'claude-sonnet-4-20250514' },
    { value: 'claude-3-7-sonnet-latest', label: 'claude-3-7-sonnet-latest' },
    { value: 'claude-3-5-sonnet-latest', label: 'claude-3-5-sonnet-latest' },
    { value: 'claude-3-5-haiku-latest', label: 'claude-3-5-haiku-latest' },
  ],
  google: [
    { value: 'gemini-2.5-flash', label: 'gemini-2.5-flash' },
    { value: 'gemini-2.5-pro', label: 'gemini-2.5-pro' },
    { value: 'gemini-2.0-flash', label: 'gemini-2.0-flash' },
  ],
}

export type PromptVariableOption = {
  label: string
  token: string
  sourceLabel: string
}

export function normalizeProvider(provider: string | undefined): ProviderKey | null {
  if (!provider) {
    return null
  }
  const normalized = provider.trim().toLowerCase()
  if (normalized === 'openai') {
    return 'openai'
  }
  if (normalized === 'anthropic') {
    return 'anthropic'
  }
  if (
    normalized === 'google' ||
    normalized === 'gemini' ||
    normalized === 'google-genai' ||
    normalized === 'google_genai'
  ) {
    return 'google'
  }
  return null
}

function findUpstreamNodes(
  targetNodeId: string,
  nodes: Node<BuilderNodeData>[],
  edges: Edge[],
): { node: Node<BuilderNodeData>; isDirectParent: boolean }[] {
  const nodeById = new Map(nodes.map((node) => [node.id, node]))
  const directParents = new Set(
    edges.filter((edge) => edge.target === targetNodeId).map((edge) => edge.source),
  )

  const visited = new Set<string>()
  const queue = [...directParents]
  const upstream: { node: Node<BuilderNodeData>; isDirectParent: boolean }[] = []

  while (queue.length > 0) {
    const id = queue.shift()!
    if (visited.has(id)) {
      continue
    }
    visited.add(id)
    const node = nodeById.get(id)
    if (node) {
      upstream.push({ node, isDirectParent: directParents.has(id) })
    }
    for (const edge of edges) {
      if (edge.target === id && !visited.has(edge.source)) {
        queue.push(edge.source)
      }
    }
  }

  return upstream
}

export function buildUpstreamPromptVariables(
  targetNodeId: string,
  nodes: Node<BuilderNodeData>[],
  edges: Edge[],
): PromptVariableOption[] {
  const upstream = findUpstreamNodes(targetNodeId, nodes, edges)
  const options: PromptVariableOption[] = []

  for (const { node, isDirectParent } of upstream) {
    const { data } = node
    if (data.type === 'trigger') {
      const triggerType = data.config.trigger_type ?? 'manual'
      if (triggerType === 'webhook') {
        options.push(
          { label: 'Webhook body', token: '{{ trigger.body }}', sourceLabel: data.label },
          { label: 'Webhook query', token: '{{ trigger.query }}', sourceLabel: data.label },
          { label: 'Webhook headers', token: '{{ trigger.headers }}', sourceLabel: data.label },
        )
      } else if (triggerType === 'scheduler') {
        options.push(
          { label: 'Scheduled time', token: '{{ trigger.scheduled_at }}', sourceLabel: data.label },
          { label: 'Cron expression', token: '{{ trigger.cron }}', sourceLabel: data.label },
        )
      } else {
        const defaultInput = data.config.default_input
        if (defaultInput && typeof defaultInput === 'object') {
          for (const key of Object.keys(defaultInput)) {
            options.push({
              label: `trigger.${key}`,
              token: `{{ trigger.${key} }}`,
              sourceLabel: data.label,
            })
          }
        }
        options.push({
          label: 'Trigger payload',
          token: '{{ trigger }}',
          sourceLabel: data.label,
        })
      }
      continue
    }

    if (data.type === 'llm') {
      options.push({
        label: `${data.label} text`,
        token: isDirectParent ? '{{ text }}' : `{{ nodes.${node.id}.text }}`,
        sourceLabel: data.label,
      })
      if (data.config.structured_output) {
        options.push({
          label: `${data.label} parsed JSON`,
          token: isDirectParent ? '{{ parsed }}' : `{{ nodes.${node.id}.parsed }}`,
          sourceLabel: data.label,
        })
      }
      continue
    }

    options.push({
      label: `${data.label} output`,
      token: `{{ nodes.${node.id} }}`,
      sourceLabel: data.label,
    })
  }

  return options
}

export function modelOptionsForCredential(
  credentials: CredentialRecord[],
  credentialLabel: string,
): { group: string; options: { value: string; label: string }[] }[] {
  const matched = credentials.find(
    (cred) => cred.name === credentialLabel || cred.id === credentialLabel,
  )
  const provider = normalizeProvider(matched?.provider)

  if (provider) {
    return [{ group: providerLabel(provider), options: MODELS_BY_PROVIDER[provider] }]
  }

  return [
    { group: 'OpenAI', options: MODELS_BY_PROVIDER.openai },
    { group: 'Anthropic', options: MODELS_BY_PROVIDER.anthropic },
    { group: 'Google (Gemini)', options: MODELS_BY_PROVIDER.google },
  ]
}
