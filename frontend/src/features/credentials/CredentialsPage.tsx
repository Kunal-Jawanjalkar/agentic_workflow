import { Eye, EyeOff, KeyRound, Pencil, Plus, Trash2 } from 'lucide-react'
import { useId, useState, type FormEvent } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  CREDENTIAL_PROVIDERS,
  providerLabel,
  type CredentialProvider,
  type CredentialRecord,
} from '@/features/credentials/api'
import {
  useCreateCredential,
  useCredentials,
  useDeleteCredential,
  useUpdateCredential,
} from '@/features/credentials/hooks'
import { getMutationErrorMessage } from '@/lib/mutation-error'
import { cn } from '@/lib/utils'

const providerBadgeStyles: Record<string, string> = {
  openai: 'bg-emerald-500/15 text-emerald-400',
  anthropic: 'bg-amber-500/15 text-amber-400',
  google: 'bg-sky-500/15 text-sky-400',
}

function normalizeProvider(provider: string): CredentialProvider {
  const lower = provider.trim().toLowerCase()
  if (lower === 'anthropic' || lower === 'google') {
    return lower
  }
  return 'openai'
}

type CredentialFormState = {
  mode: 'create' | 'edit'
  credentialId?: string
  name: string
  provider: CredentialProvider
  apiKey: string
}

const emptyCreateForm: CredentialFormState = {
  mode: 'create',
  name: '',
  provider: 'openai',
  apiKey: '',
}

export function CredentialsPage() {
  const providerId = useId()
  const nameId = useId()
  const apiKeyId = useId()

  const { data: credentials = [], isPending, isError } = useCredentials()
  const createMutation = useCreateCredential()
  const updateMutation = useUpdateCredential()
  const deleteMutation = useDeleteCredential()

  const [formState, setFormState] = useState<CredentialFormState | null>(null)
  const [showApiKey, setShowApiKey] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const isSaving = createMutation.isPending || updateMutation.isPending
  const activeMutationError =
    formState?.mode === 'edit' ? updateMutation.error : createMutation.error
  const serverError = getMutationErrorMessage(activeMutationError)
  const deleteError = getMutationErrorMessage(deleteMutation.error)

  const openCreateForm = () => {
    createMutation.reset()
    updateMutation.reset()
    setValidationError(null)
    setShowApiKey(false)
    setFormState(emptyCreateForm)
  }

  const openEditForm = (credential: CredentialRecord) => {
    createMutation.reset()
    updateMutation.reset()
    setValidationError(null)
    setShowApiKey(false)
    setFormState({
      mode: 'edit',
      credentialId: credential.id,
      name: credential.name,
      provider: normalizeProvider(credential.provider),
      apiKey: '',
    })
  }

  const closeForm = () => {
    setFormState(null)
    setValidationError(null)
    setShowApiKey(false)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!formState) {
      return
    }

    const trimmedName = formState.name.trim()
    const trimmedKey = formState.apiKey.trim()

    if (!trimmedName) {
      setValidationError('Credential name is required.')
      return
    }
    if (trimmedName.length > 200) {
      setValidationError('Credential name must be 200 characters or fewer.')
      return
    }
    if (formState.mode === 'create' && !trimmedKey) {
      setValidationError('API key is required.')
      return
    }

    setValidationError(null)

    try {
      if (formState.mode === 'create') {
        await createMutation.mutateAsync({
          name: trimmedName,
          provider: formState.provider,
          apiKey: trimmedKey,
        })
      } else if (formState.credentialId) {
        await updateMutation.mutateAsync({
          credentialId: formState.credentialId,
          name: trimmedName,
          provider: formState.provider,
          ...(trimmedKey ? { apiKey: trimmedKey } : {}),
        })
      }
      closeForm()
    } catch {
      // Mutation error state is displayed via getMutationErrorMessage.
    }
  }

  const handleDelete = async (credentialId: string) => {
    setDeletingId(credentialId)
    try {
      await deleteMutation.mutateAsync(credentialId)
      if (formState?.credentialId === credentialId) {
        closeForm()
      }
    } catch {
      // Mutation error state is displayed above the table.
    } finally {
      setDeletingId(null)
    }
  }

  const selectedProviderMeta = formState
    ? CREDENTIAL_PROVIDERS.find((item) => item.value === formState.provider)
    : undefined

  return (
    <div className="flex min-h-full flex-col gap-6 p-6 md:p-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Credentials</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Store encrypted API keys for OpenAI, Anthropic, and Google. Reference a credential by
            its name in LLM nodes.
          </p>
        </div>
        {!formState ? (
          <Button type="button" variant="outline" className="gap-1.5" onClick={openCreateForm}>
            <Plus className="size-4" />
            Add credential
          </Button>
        ) : null}
      </header>

      {formState ? (
        <section
          aria-label={formState.mode === 'create' ? 'Add credential' : 'Edit credential'}
          className="rounded-xl border border-border/60 bg-card p-5"
        >
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-base font-medium">
              {formState.mode === 'create' ? 'New credential' : 'Edit credential'}
            </h2>
            <Button type="button" variant="ghost" size="sm" onClick={closeForm}>
              Cancel
            </Button>
          </div>

          <form onSubmit={(event) => void handleSubmit(event)} className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1.5">
              <label htmlFor={providerId} className="text-sm font-medium">
                Provider
              </label>
              <select
                id={providerId}
                value={formState.provider}
                disabled={isSaving}
                onChange={(event) =>
                  setFormState((current) =>
                    current
                      ? { ...current, provider: event.target.value as CredentialProvider }
                      : current,
                  )
                }
                className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm dark:bg-input/30"
              >
                {CREDENTIAL_PROVIDERS.map((provider) => (
                  <option key={provider.value} value={provider.value}>
                    {provider.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor={nameId} className="text-sm font-medium">
                Credential name
              </label>
              <Input
                id={nameId}
                value={formState.name}
                disabled={isSaving}
                maxLength={200}
                placeholder="e.g. My OpenAI key"
                onChange={(event) =>
                  setFormState((current) =>
                    current ? { ...current, name: event.target.value } : current,
                  )
                }
              />
              <p className="text-xs text-muted-foreground">
                Used as Credential Label in workflow nodes.
              </p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor={apiKeyId} className="text-sm font-medium">
                {formState.mode === 'create' ? 'API key' : 'New API key (optional)'}
              </label>
              <div className="relative">
                <Input
                  id={apiKeyId}
                  type={showApiKey ? 'text' : 'password'}
                  value={formState.apiKey}
                  disabled={isSaving}
                  autoComplete="off"
                  className="pr-9"
                  placeholder={
                    formState.mode === 'edit'
                      ? 'Leave blank to keep existing key'
                      : (selectedProviderMeta?.placeholder ?? 'Paste API key')
                  }
                  onChange={(event) =>
                    setFormState((current) =>
                      current ? { ...current, apiKey: event.target.value } : current,
                    )
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="absolute top-1/2 right-1 -translate-y-1/2 text-muted-foreground"
                  aria-label={showApiKey ? 'Hide API key' : 'Show API key'}
                  aria-pressed={showApiKey}
                  onClick={() => setShowApiKey((current) => !current)}
                >
                  {showApiKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </Button>
              </div>
            </div>

            {validationError || serverError ? (
              <p role="alert" className="text-sm text-destructive md:col-span-3">
                {validationError ?? serverError}
              </p>
            ) : null}

            <div className="flex items-center justify-end gap-2 md:col-span-3">
              <Button type="button" variant="outline" onClick={closeForm} disabled={isSaving}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving
                  ? 'Saving…'
                  : formState.mode === 'create'
                    ? 'Save credential'
                    : 'Update credential'}
              </Button>
            </div>
          </form>
        </section>
      ) : null}

      {deleteError ? (
        <p role="alert" className="text-sm text-destructive">
          {deleteError}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
        <table className="w-full min-w-[600px] text-left text-sm">
          <thead>
            <tr className="border-b border-border/60 text-muted-foreground">
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-5 py-3 font-medium">Provider</th>
              <th className="px-5 py-3 font-medium">Created</th>
              <th className="px-5 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isPending ? (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-muted-foreground">
                  Loading credentials…
                </td>
              </tr>
            ) : isError ? (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-destructive">
                  Could not load credentials.
                </td>
              </tr>
            ) : credentials.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-12 text-center">
                  <div className="mx-auto flex max-w-sm flex-col items-center gap-2">
                    <KeyRound className="size-5 text-muted-foreground" aria-hidden />
                    <p className="font-medium">No credentials yet</p>
                    <p className="text-xs text-muted-foreground">
                      Add an OpenAI, Anthropic, or Google API key to use LLM nodes in your
                      workflows.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              credentials.map((credential) => {
                const badgeStyle =
                  providerBadgeStyles[credential.provider.toLowerCase()] ??
                  'border border-border/80 bg-transparent text-muted-foreground'
                return (
                  <tr key={credential.id} className="border-b border-border/40 last:border-0">
                    <td className="px-5 py-4 font-medium">{credential.name}</td>
                    <td className="px-5 py-4">
                      <span
                        className={cn(
                          'inline-flex rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap',
                          badgeStyle,
                        )}
                      >
                        {providerLabel(credential.provider)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {new Date(credential.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Edit ${credential.name}`}
                          onClick={() => openEditForm(credential)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          disabled={deletingId === credential.id}
                          aria-label={`Delete ${credential.name}`}
                          onClick={() => void handleDelete(credential.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
