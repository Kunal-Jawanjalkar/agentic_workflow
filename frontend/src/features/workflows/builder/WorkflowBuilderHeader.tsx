import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
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
  onPublish?: () => void | Promise<void>
  onUnpublish?: () => void | Promise<void>
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
  onUnpublish,
  isPublishing = false,
  publishDisabled = false,
}: WorkflowBuilderHeaderProps) {
  const [confirmAction, setConfirmAction] = useState<'publish' | 'unpublish' | null>(null)
  const isPublished = statusTone === 'published'
  const actionDisabled = publishDisabled || isPublishing || (isPublished ? !onUnpublish : !onPublish)

  const handleConfirm = async () => {
    const action = confirmAction
    setConfirmAction(null)
    if (action === 'publish') {
      await onPublish?.()
    } else if (action === 'unpublish') {
      await onUnpublish?.()
    }
  }
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
          variant={isPublished ? 'outline' : 'default'}
          disabled={actionDisabled}
          onClick={() => setConfirmAction(isPublished ? 'unpublish' : 'publish')}
        >
          {isPublishing
            ? isPublished
              ? 'Unpublishing…'
              : 'Publishing…'
            : isPublished
              ? 'Unpublish'
              : 'Publish'}
        </Button>
      </div>

      <DialogPrimitive.Root
        open={confirmAction !== null}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmAction(null)
          }
        }}
      >
        <DialogPrimitive.Portal>
          <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs" />
          <DialogPrimitive.Popup className="fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-popover p-6 text-popover-foreground shadow-lg">
            <DialogPrimitive.Title className="text-base font-semibold">
              {confirmAction === 'unpublish' ? 'Unpublish workflow?' : 'Publish workflow?'}
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="mt-2 text-sm text-muted-foreground">
              {confirmAction === 'unpublish'
                ? 'This will disable the active trigger and stop live webhook or scheduled runs until you publish again.'
                : 'This will save your latest changes and activate the workflow trigger for live runs.'}
            </DialogPrimitive.Description>
            <div className="mt-5 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setConfirmAction(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                variant={confirmAction === 'unpublish' ? 'destructive' : 'default'}
                onClick={() => void handleConfirm()}
              >
                {confirmAction === 'unpublish' ? 'Confirm unpublish' : 'Confirm publish'}
              </Button>
            </div>
          </DialogPrimitive.Popup>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </header>
  )
}