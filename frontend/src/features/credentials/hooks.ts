import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createCredential,
  credentialQueryKeys,
  deleteCredential,
  listCredentials,
  updateCredential,
  type CreateCredentialInput,
  type UpdateCredentialInput,
} from '@/features/credentials/api'

export function useCredentials() {
  return useQuery({
    queryKey: credentialQueryKeys.list,
    queryFn: listCredentials,
  })
}

export function useCreateCredential() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateCredentialInput) => createCredential(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: credentialQueryKeys.list })
    },
  })
}

export function useUpdateCredential() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: UpdateCredentialInput) => updateCredential(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: credentialQueryKeys.list })
    },
  })
}

export function useDeleteCredential() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (credentialId: string) => deleteCredential(credentialId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: credentialQueryKeys.list })
    },
  })
}
