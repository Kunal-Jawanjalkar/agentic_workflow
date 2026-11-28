import { Check, Pencil, X } from 'lucide-react'
import { useId, useState, type FormEvent } from 'react'

import { appShellHeaderClassName } from '@/components/app/app-shell-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const WORKFLOW_NAME_MAX_LENGTH = 200

type WorkflowBuilderHeaderProps = {
  title: string
  statusLabel: string
  statusTone: 'draft' | 'published'
  savedLabel: string
  titleEditable?: boolean
  onTitleChange?: (name: string) => void | Promise<void>
  onRunTest?: () => void
  isRunningTest?: boolean
  runTestDisabled?: boolean
  runStatusMessage?: string | null
  onPublish?: () => void
  isPublishing?: boolean
  publishDisabled?: boolean
}

function EditableWorkflowTitle({
  title,
  editable,
  onTitleChange,
}: {
  title: string
  editable: boolean
  onTitleChange?: (name: string) => void | Promise<void>
}) {
  const inputId = useId()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(title)
  const [saving, setSaving] = useState(false)

  if (!editable || !onTitleChange) {
    return (
      <h1 className="truncate text-lg font-semibold tracking-tight">{title}</h1>
    )
  }

  const cancelEdit = () => {
    setDraft(title)
    setEditing(false)
  }

  const commitTitle = async () => {
    const trimmed = draft.trim()
    if (!trimmed) {
      cancelEdit()
      return
    }
    if (trimmed === title) {
      setEditing(false)
      return
    }
    setSaving(true)
    try {
      await onTitleChange(trimmed.slice(0, WORKFLOW_NAME_MAX_LENGTH))
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void commitTitle()
  }

  if (editing) {
    return (
      <form
        className="flex min-w-0 max-w-sm flex-1 items-center gap-1"
        onSubmit={onSubmit}
      >
        <label htmlFor={inputId} className="sr-only">
          Workflow name
        </label>
        <Input
          id={inputId}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          maxLength={WORKFLOW_NAME_MAX_LENGTH}
          disabled={saving}
          className="h-8 text-base font-semibold"
          autoFocus
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault()
              cancelEdit()
            }
          }}
        />
        <Button
          type="submit"
          variant="ghost"
          size="icon-sm"
          disabled={saving}
          aria-label="Save workflow name"
        >
          <Check className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={saving}
          aria-label="Cancel rename"
          onClick={cancelEdit}
        >
          <X className="size-4" />
        </Button>
      </form>
    )
  }

  return (
    <div className="flex min-w-0 items-center gap-0.5">
      <h1 className="truncate text-lg font-semibold tracking-tight">{title}</h1>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="shrink-0 text-muted-foreground"
        aria-label="Edit workflow name"
        onClick={() => {
          setDraft(title)
          setEditing(true)
        }}
      >
        <Pencil className="size-4" />
      </Button>
    </div>
  )
}

export function WorkflowBuilderHeader({
  title,
  statusLabel,
  statusTone,
  savedLabel,
  titleEditable = false,
  onTitleChange,
  onRunTest,
  isRunningTest = false,
  runTestDisabled = false,
  runStatusMessage,
  onPublish,
  isPublishing = false,
  publishDisabled = false,
}: WorkflowBuilderHeaderProps) {
  return (
    <header
      className={cn(
        appShellHeaderClassName,
        'justify-between gap-3 bg-background px-4',
        'max-sm:h-auto max-sm:min-h-14 max-sm:flex-col max-sm:items-stretch max-sm:py-3',
      )}
    >
      <div className="flex min-w-0 flex-wrap items-center gap-3 max-sm:w-full">
        <EditableWorkflowTitle
          title={title}
          editable={titleEditable}
          onTitleChange={onTitleChange}
        />
        <span
          className={cn(
            'inline-flex rounded-md px-2 py-0.5 text-xs font-medium',
            statusTone === 'draft' && 'bg-amber-500/15 text-amber-400',
            statusTone === 'published' && 'bg-emerald-500/15 text-emerald-400',
          )}
        >
          {statusLabel}
        </span>
        <span className="text-xs text-muted-foreground">{savedLabel}</span>
        {runStatusMessage ? (
          <span className="text-xs text-muted-foreground">{runStatusMessage}</span>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={runTestDisabled || isRunningTest || !onRunTest}
          onClick={onRunTest}
        >
          {isRunningTest ? 'Running…' : 'Run test'}
        </Button>
        <Button type="button" variant="outline" size="sm">
          Run evals
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={publishDisabled || isPublishing}
          onClick={onPublish}
        >
          {isPublishing ? 'Publishing…' : 'Publish'}
        </Button>
      </div>
    </header>
  )
}