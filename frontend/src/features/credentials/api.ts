import { apiRequest } from '@/lib/api'

export const CREDENTIAL_PROVIDERS = [
  { value: 'openai', label: 'OpenAI', placeholder: 'sk-...' },
  { value: 'anthropic', label: 'Anthropic', placeholder: 'sk-ant-...' },
  { value: 'google', label: 'Google (Gemini)', placeholder: 'AIza...' },
] as const

export type CredentialProvider = (typeof CREDENTIAL_PROVIDERS)[number]['value']

export type CredentialRecord = {
  id: string
  name: string
  provider: string
  created_at: string
}

export type CreateCredentialInput = {
  name: string
  provider: CredentialProvider
  apiKey: string
}

export type UpdateCredentialInput = {
  credentialId: string
  name?: string
  provider?: CredentialProvider
  apiKey?: string
}

type CredentialListResponse = {
  credentials: CredentialRecord[]
}

export const credentialQueryKeys = {
  list: ['credentials', 'list'] as const,
}

export function providerLabel(provider: string): string {
  const normalized = provider.trim().toLowerCase()
  const match = CREDENTIAL_PROVIDERS.find((item) => item.value === normalized)
  return match ? match.label : provider
}

export function listCredentials(): Promise<CredentialRecord[]> {
  return apiRequest<CredentialListResponse>('/api/v1/credentials').then(
    (response) => response.credentials,
  )
}

export function createCredential(input: CreateCredentialInput): Promise<CredentialRecord> {
  return apiRequest<CredentialRecord>('/api/v1/credentials', {
    method: 'POST',
    body: JSON.stringify({
      name: input.name.trim(),
      provider: input.provider,
      secret: { apiKey: input.apiKey.trim() },
    }),
  })
}

export function updateCredential(input: UpdateCredentialInput): Promise<CredentialRecord> {
  const payload: {
    name?: string
    provider?: CredentialProvider
    secret?: { apiKey: string }
  } = {}

  if (input.name !== undefined) {
    payload.name = input.name.trim()
  }
  if (input.provider !== undefined) {
    payload.provider = input.provider
  }
  if (input.apiKey !== undefined && input.apiKey.trim().length > 0) {
    payload.secret = { apiKey: input.apiKey.trim() }
  }

  return apiRequest<CredentialRecord>(`/api/v1/credentials/${input.credentialId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function deleteCredential(credentialId: string): Promise<void> {
  return apiRequest<void>(`/api/v1/credentials/${credentialId}`, {
    method: 'DELETE',
  })
}
