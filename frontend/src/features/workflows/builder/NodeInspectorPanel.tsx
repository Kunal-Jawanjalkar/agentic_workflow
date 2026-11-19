import type { Node } from '@xyflow/react'

import { Button } from '@/components/ui/button'
import type { BuilderNodeData, LlmNodeConfig } from '@/features/workflows/builder/types'

type NodeInspectorPanelProps = {
  node: Node<BuilderNodeData> | null
  onUpdateLlmConfig: (nodeId: string, patch: Partial<LlmNodeConfig>) => void
}

const kindLabels: Record<BuilderNodeData['kind'], string> = {
  trigger: 'Trigger node',
  llm: 'LLM node',
  agent: 'Agent node',
  condition: 'Condition node',
  http: 'HTTP node',
  approval: 'Approval node',
  notify: 'Notify node',
}

function FieldLabel({ children }: { children: string }) {
  return <label className="text-xs font-medium text-muted-foreground">{children}</label>
}

export function NodeInspectorPanel({ node, onUpdateLlmConfig }: NodeInspectorPanelProps) {
  if (!node) {
    return (
      <aside
        className="flex w-80 shrink-0 flex-col border-l border-border/60 bg-card/20 p-4"
        aria-label="Node configuration"
      >
        <p className="text-sm text-muted-foreground">Select a node to configure it.</p>
      </aside>
    )
  }

  const { data } = node
  const isLlm = data.kind === 'llm'
  const llmConfig = isLlm ? (data.config as LlmNodeConfig) : null

  return (
    <aside
      className="flex w-80 shrink-0 flex-col border-l border-border/60 bg-card/20"
      aria-label="Node configuration"
    >
      <div className="border-b border-border/60 px-4 py-4">
        <h2 className="font-semibold">{data.label}</h2>
        <p className="text-sm text-muted-foreground">{kindLabels[data.kind]}</p>
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
        {isLlm && llmConfig ? (
          <>
            <div className="space-y-1.5">
              <FieldLabel>API key</FieldLabel>
              <select
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm dark:bg-input/30"
                value={llmConfig.credentialLabel}
                onChange={(event) =>
                  onUpdateLlmConfig(node.id, { credentialLabel: event.target.value })
                }
              >
                <option value="My OpenAI key (…)">My OpenAI key (…)</option>
                <option value="Team Anthropic key">Team Anthropic key</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <FieldLabel>Model</FieldLabel>
              <select
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm dark:bg-input/30"
                value={llmConfig.model}
                onChange={(event) => onUpdateLlmConfig(node.id, { model: event.target.value })}
              >
                <option value="gpt-4o-mini">gpt-4o-mini</option>
                <option value="gpt-4o">gpt-4o</option>
                <option value="claude-sonnet">claude-sonnet</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <FieldLabel>Prompt</FieldLabel>
              <textarea
                className="min-h-28 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm dark:bg-input/30"
                value={llmConfig.prompt}
                onChange={(event) => onUpdateLlmConfig(node.id, { prompt: event.target.value })}
              />
            </div>
            <div className="flex items-center justify-between gap-2">
              <FieldLabel>Structured output</FieldLabel>
              <Button
                type="button"
                size="sm"
                variant={llmConfig.structuredOutput ? 'secondary' : 'outline'}
                onClick={() =>
                  onUpdateLlmConfig(node.id, {
                    structuredOutput: !llmConfig.structuredOutput,
                  })
                }
              >
                {llmConfig.structuredOutput ? 'On' : 'Off'}
              </Button>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Configuration for {kindLabels[data.kind].toLowerCase()}s is coming soon.
          </p>
        )}
      </div>

      {isLlm ? (
        <p className="border-t border-border/60 px-4 py-3 text-xs text-muted-foreground">
          Last test: $0.0009, 1.2s
        </p>
      ) : null}
    </aside>
  )
}
