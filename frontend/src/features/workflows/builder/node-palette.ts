import type { PaletteItem } from './types'

export const addNodePalette: PaletteItem[] = [
  { kind: 'trigger', label: 'Trigger' },
  { kind: 'llm', label: 'LLM' },
  { kind: 'agent', label: 'Agent' },
  { kind: 'condition', label: 'Condition' },
  { kind: 'http', label: 'HTTP' },
  { kind: 'approval', label: 'Approval' },
  { kind: 'notify', label: 'Notify' },
]

export const defaultLlmConfig = {
  credentialLabel: 'My OpenAI key (…)',
  model: 'gpt-4o-mini',
  prompt: 'Classify this ticket: {{ trigger.body.text }}',
  structuredOutput: true,
} as const
