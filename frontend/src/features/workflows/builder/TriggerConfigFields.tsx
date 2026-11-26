import { Check, Copy, Play, RefreshCw } from 'lucide-react'
import { useId, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { TriggerNodeConfig, TriggerType } from '@/features/workflows/builder/types'

type TriggerConfigFieldsProps = {
  workflowId?: string
  config: TriggerNodeConfig
  onPatch: (patch: Record<string, unknown>) => void
  onRunTest?: () => void
  isRunningTest?: boolean
  onSyncSchedule?: () => void
  isSyncingSchedule?: boolean
  scheduleStatus?: string | null
}

const controlClassName =
  'h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm dark:bg-input/30'

const textareaClassName =
  'min-h-24 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 font-mono text-xs dark:bg-input/30'

const CRON_PRESETS: { label: string; cron: string }[] = [
  { label: 'Every 5 minutes', cron: '*/5 * * * *' },
  { label: 'Hourly', cron: '0 * * * *' },
  { label: 'Daily at 09:00', cron: '0 9 * * *' },
  { label: 'Weekly (Mon 09:00)', cron: '0 9 * * 1' },
]

const HTTP_METHODS = ['POST', 'GET', 'PUT', 'PATCH', 'DELETE'] as const

const TRIGGER_DESCRIPTIONS: Record<TriggerType, string> = {
  manual: 'Starts when you click Run test or trigger a run via the API.',
  webhook: 'Starts when an external system sends an HTTP request to the webhook URL.',
  scheduler: 'Starts automatically on a recurring cron schedule managed by Temporal.',
}

function normalizeTriggerType(value: string | undefined): TriggerType {
  if (value === 'webhook' || value === 'scheduler') {
    return value
  }
  return 'manual'
}

export function TriggerConfigFields({
  workflowId,
  config,
  onPatch,
  onRunTest,
  isRunningTest = false,
  onSyncSchedule,
  isSyncingSchedule = false,
  scheduleStatus,
}: TriggerConfigFieldsProps) {
  const triggerTypeId = useId()
  const methodId = useId()
  const secretId = useId()
  const presetId = useId()
  const cronId = useId()
  const timezoneId = useId()
  const defaultInputId = useId()

  const triggerType = normalizeTriggerType(config.trigger_type)
  const [copiedWebhook, setCopiedWebhook] = useState(false)
  const [inputDraft, setInputDraft] = useState(() =>
    config.default_input ? JSON.stringify(config.default_input, null, 2) : '{}',
  )
  const [inputError, setInputError] = useState<string | null>(null)

  const webhookPath = workflowId ? `/api/v1/webhooks/${workflowId}` : null
  const webhookUrl =
    webhookPath && typeof window !== 'undefined'
      ? `${window.location.origin}${webhookPath}`
      : webhookPath

  const cronValue = config.cron ?? ''
  const matchingPreset = CRON_PRESETS.find((preset) => preset.cron === cronValue)?.cron ?? 'custom'

  const handleCopyWebhook = async () => {
    if (!webhookUrl || typeof navigator === 'undefined' || !navigator.clipboard) {
      return
    }
    await navigator.clipboard.writeText(webhookUrl)
    setCopiedWebhook(true)
    setTimeout(() => setCopiedWebhook(false), 1500)
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor={triggerTypeId} className="text-xs font-medium text-muted-foreground">
          Trigger Type
        </label>
        <select
          id={triggerTypeId}
          className={controlClassName}
          value={triggerType}
          onChange={(event) => onPatch({ trigger_type: event.target.value })}
        >
          <option value="manual">manual</option>
          <option value="webhook">webhook</option>
          <option value="scheduler">scheduler</option>
        </select>
        <p className="text-xs text-muted-foreground">{TRIGGER_DESCRIPTIONS[triggerType]}</p>
      </div>

      {triggerType === 'manual' ? (
        <div className="space-y-3 border-t border-border/60 pt-3">
          <div className="space-y-1.5">
            <label htmlFor={defaultInputId} className="text-xs font-medium text-muted-foreground">
              Default Input (JSON)
            </label>
            <textarea
              id={defaultInputId}
              className={textareaClassName}
              value={inputDraft}
              onChange={(event) => {
                setInputDraft(event.target.value)
                setInputError(null)
              }}
              onBlur={() => {
                const trimmed = inputDraft.trim()
                if (!trimmed) {
                  onPatch({ default_input: {} })
                  setInputDraft('{}')
                  setInputError(null)
                  return
                }
                try {
                  const parsed: unknown = JSON.parse(trimmed)
                  if (parsed == null || typeof parsed !== 'object' || Array.isArray(parsed)) {
                    setInputError('Must be a JSON object')
                    return
                  }
                  onPatch({ default_input: parsed })
                  setInputError(null)
                } catch {
                  setInputError('Invalid JSON')
                }
              }}
            />
            {inputError ? <p className="text-xs text-destructive">{inputError}</p> : null}
          </div>
          {onRunTest ? (
            <Button
              type="button"
              size="sm"
              className="w-full"
              disabled={isRunningTest}
              onClick={onRunTest}
            >
              <Play className="size-3.5" />
              {isRunningTest ? 'Starting run…' : 'Run manual trigger'}
            </Button>
          ) : null}
        </div>
      ) : null}

      {triggerType === 'webhook' ? (
        <div className="space-y-3 border-t border-border/60 pt-3">
          <div className="space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">Webhook URL</span>
            {webhookUrl ? (
              <div className="flex items-center gap-1.5">
                <Input readOnly value={webhookUrl} aria-label="Webhook URL" className="text-xs" />
                <Button
                  type="button"
                  size="icon-sm"
                  variant="outline"
                  aria-label="Copy webhook URL"
                  onClick={() => void handleCopyWebhook()}
                >
                  {copiedWebhook ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                </Button>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Save this workflow to generate a webhook URL.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor={methodId} className="text-xs font-medium text-muted-foreground">
              HTTP Method
            </label>
            <select
              id={methodId}
              className={controlClassName}
              value={config.webhook_method ?? 'POST'}
              onChange={(event) => onPatch({ webhook_method: event.target.value })}
            >
              {HTTP_METHODS.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor={secretId} className="text-xs font-medium text-muted-foreground">
              Webhook Secret (optional)
            </label>
            <Input
              id={secretId}
              type="password"
              value={config.webhook_secret ?? ''}
              placeholder="Verified against x-webhook-secret"
              onChange={(event) =>
                onPatch({
                  webhook_secret: event.target.value.length > 0 ? event.target.value : undefined,
                })
              }
            />
          </div>
        </div>
      ) : null}

      {triggerType === 'scheduler' ? (
        <div className="space-y-3 border-t border-border/60 pt-3">
          <div className="space-y-1.5">
            <label htmlFor={presetId} className="text-xs font-medium text-muted-foreground">
              Schedule Preset
            </label>
            <select
              id={presetId}
              className={controlClassName}
              value={matchingPreset}
              onChange={(event) => {
                if (event.target.value !== 'custom') {
                  onPatch({ cron: event.target.value })
                }
              }}
            >
              {CRON_PRESETS.map((preset) => (
                <option key={preset.cron} value={preset.cron}>
                  {preset.label}
                </option>
              ))}
              <option value="custom">Custom cron</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor={cronId} className="text-xs font-medium text-muted-foreground">
              Cron Expression
            </label>
            <Input
              id={cronId}
              value={cronValue}
              placeholder="*/5 * * * *"
              onChange={(event) => onPatch({ cron: event.target.value })}
            />
            <p className="text-xs text-muted-foreground">Standard 5-field cron (min hour dom mon dow).</p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor={timezoneId} className="text-xs font-medium text-muted-foreground">
              Timezone
            </label>
            <Input
              id={timezoneId}
              value={config.timezone ?? 'UTC'}
              placeholder="UTC"
              onChange={(event) => onPatch({ timezone: event.target.value })}
            />
          </div>

          {onSyncSchedule ? (
            <div className="space-y-1.5">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="w-full"
                disabled={isSyncingSchedule || cronValue.trim().length === 0}
                onClick={onSyncSchedule}
              >
                <RefreshCw className="size-3.5" />
                {isSyncingSchedule ? 'Syncing schedule…' : 'Sync Temporal schedule'}
              </Button>
              {scheduleStatus ? (
                <p className="text-xs text-muted-foreground">{scheduleStatus}</p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
