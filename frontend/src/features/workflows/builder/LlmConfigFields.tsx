import { useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Edge, Node } from '@xyflow/react'

import { Button } from '@/components/ui/button'
import { providerLabel } from '@/features/credentials/api'
import { useCredentials } from '@/features/credentials/hooks'
import {
  MODELS_BY_PROVIDER,
  buildUpstreamPromptVariables,
  modelOptionsForCredential,
  normalizeProvider,
} from '@/features/workflows/builder/llm-config'
import type { BuilderNodeData, LlmNodeConfig } from '@/features/workflows/builder/types'

type LlmConfigFieldsProps = {
  nodeId: string
  config: LlmNodeConfig
  nodes: Node<BuilderNodeData>[]
  edges: Edge[]
  onPatch: (patch: Record<string, unknown>) => void
}

const controlClassName =
  'h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm dark:bg-input/30'

const textareaClassName =
  'min-h-28 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm dark:bg-input/30'

export function LlmConfigFields({
  nodeId,
  config,
  nodes,
  edges,
  onPatch,
}: LlmConfigFieldsProps) {
  const credentialSelectId = useId()
  const modelSelectId = useId()
  const promptId = useId()
  const variableSelectId = useId()
  const promptRef = useRef<HTMLTextAreaElement | null>(null)
  const [selectedVariable, setSelectedVariable] = useState('')

  const { data: credentials = [], isPending: isLoadingCredentials } = useCredentials()

  const credentialLabel = config.credential_label ?? ''
  const modelValue = config.model ?? ''
  const promptValue = config.prompt ?? ''
  const structuredOutput = config.structured_output === true

  const hasSavedCredentialMatch = credentials.some(
    (cred) => cred.name === credentialLabel || cred.id === credentialLabel,
  )

  const modelGroups = modelOptionsForCredential(credentials, credentialLabel)
  const allListedModels = modelGroups.flatMap((group) => group.options.map((option) => option.value))
  const hasModelInList = modelValue !== '' && allListedModels.includes(modelValue)

  const upstreamVariables = buildUpstreamPromptVariables(nodeId, nodes, edges)

  const handleCredentialChange = (nextLabel: string) => {
    const matched = credentials.find((cred) => cred.name === nextLabel)
    const nextProvider = normalizeProvider(matched?.provider)

    if (!nextProvider) {
      onPatch({ credential_label: nextLabel })
      return
    }

    const providerModels = MODELS_BY_PROVIDER[nextProvider]
    const currentStillValid = providerModels.some((item) => item.value === modelValue)
    if (!currentStillValid && providerModels[0]) {
      onPatch({ credential_label: nextLabel, model: providerModels[0].value })
      return
    }

    onPatch({ credential_label: nextLabel })
  }

  const insertTokenIntoPrompt = (token: string) => {
    if (!token) {
      return
    }
    const textarea = promptRef.current
    if (!textarea) {
      const separator = promptValue.length > 0 && !promptValue.endsWith(' ') ? ' ' : ''
      onPatch({ prompt: `${promptValue}${separator}${token}` })
      return
    }

    const isFocused = typeof document !== 'undefined' && document.activeElement === textarea
    const start = isFocused ? (textarea.selectionStart ?? promptValue.length) : promptValue.length
    const end = isFocused ? (textarea.selectionEnd ?? promptValue.length) : promptValue.length
    const nextPrompt = `${promptValue.slice(0, start)}${token}${promptValue.slice(end)}`
    onPatch({ prompt: nextPrompt })
    setSelectedVariable('')
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <label htmlFor={credentialSelectId} className="text-xs font-medium text-muted-foreground">
            Credential
          </label>
          <Link to="/credentials" className="text-xs text-primary hover:underline">
            Manage
          </Link>
        </div>
        <select
          id={credentialSelectId}
          className={controlClassName}
          value={credentialLabel}
          disabled={isLoadingCredentials}
          onChange={(event) => handleCredentialChange(event.target.value)}
        >
          <option value="">
            {isLoadingCredentials ? 'Loading credentials…' : 'Select credential…'}
          </option>
          {!hasSavedCredentialMatch && credentialLabel !== '' ? (
            <option value={credentialLabel}>{credentialLabel} (not found)</option>
          ) : null}
          {credentials.map((credential) => (
            <option key={credential.id} value={credential.name}>
              {credential.name} ({providerLabel(credential.provider)})
            </option>
          ))}
        </select>
        {!isLoadingCredentials && credentials.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No credentials saved yet.{' '}
            <Link to="/credentials" className="underline">
              Add one in Credentials
            </Link>
            .
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <label htmlFor={modelSelectId} className="text-xs font-medium text-muted-foreground">
          Model
        </label>
        <select
          id={modelSelectId}
          className={controlClassName}
          value={modelValue}
          onChange={(event) => onPatch({ model: event.target.value })}
        >
          <option value="">Select model…</option>
          {!hasModelInList && modelValue !== '' ? (
            <option value={modelValue}>{modelValue}</option>
          ) : null}
          {modelGroups.map((group) => (
            <optgroup key={group.group} label={group.group}>
              {group.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <label htmlFor={promptId} className="text-xs font-medium text-muted-foreground">
            Prompt
          </label>
          {upstreamVariables.length > 0 ? (
            <span className="text-[11px] text-muted-foreground">
              {upstreamVariables.length} upstream field{upstreamVariables.length === 1 ? '' : 's'}
            </span>
          ) : null}
        </div>

        {upstreamVariables.length > 0 ? (
          <div className="space-y-1.5 rounded-lg border border-border/60 bg-muted/20 p-2">
            <label htmlFor={variableSelectId} className="block text-[11px] font-medium text-muted-foreground">
              Insert from previous node
            </label>
            <select
              id={variableSelectId}
              className={controlClassName}
              value={selectedVariable}
              onChange={(event) => insertTokenIntoPrompt(event.target.value)}
            >
              <option value="">Choose input field…</option>
              {upstreamVariables.map((variable) => (
                <option key={variable.token} value={variable.token}>
                  {variable.sourceLabel}: {variable.label} ({variable.token})
                </option>
              ))}
            </select>
            <div className="flex flex-wrap gap-1 pt-0.5">
              {upstreamVariables.map((variable) => (
                <button
                  key={variable.token}
                  type="button"
                  onClick={() => insertTokenIntoPrompt(variable.token)}
                  className="rounded border border-border/70 bg-background px-1.5 py-0.5 font-mono text-[11px] text-foreground hover:bg-muted"
                >
                  {variable.token}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Connect an upstream node to insert its output into the prompt.
          </p>
        )}

        <textarea
          ref={promptRef}
          id={promptId}
          className={textareaClassName}
          placeholder="Write your prompt, e.g. Classify: {{ trigger.body }}"
          value={promptValue}
          onChange={(event) => onPatch({ prompt: event.target.value })}
        />
      </div>

      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-medium text-muted-foreground">Structured Output</label>
        <Button
          type="button"
          size="sm"
          variant={structuredOutput ? 'secondary' : 'outline'}
          onClick={() => onPatch({ structured_output: !structuredOutput })}
        >
          {structuredOutput ? 'On' : 'Off'}
        </Button>
      </div>
    </div>
  )
}
