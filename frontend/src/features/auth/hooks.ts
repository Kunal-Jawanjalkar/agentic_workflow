import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  authQueryKeys,
  loginUser,
  registerUser,
} from '@/features/auth/api'
import type { LoginResponse, UserPublic } from '@/types/auth'
import type { LoginFormValues, RegisterFormValues } from '@/features/auth/schemas'

export function useLoginMutation() {
  const queryClient = useQueryClient()

  return useMutation<LoginResponse, Error, LoginFormValues>({
    mutationFn: (values) => loginUser(values),
    onSuccess: (data) => {
      queryClient.setQueryData(authQueryKeys.me, data.user)
    },
  })
}

export function useRegisterMutation() {
  return useMutation<UserPublic, Error, RegisterFormValues>({
    mutationFn: ({ password_confirm: _passwordConfirm, ...values }) =>
      registerUser(values),
  })
}
