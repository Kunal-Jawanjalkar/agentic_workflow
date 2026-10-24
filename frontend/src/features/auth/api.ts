import { apiRequest } from '@/lib/api'
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  UserPublic,
} from '@/types/auth'

export const authQueryKeys = {
  me: ['auth', 'me'] as const,
}

export function fetchCurrentUser(): Promise<UserPublic> {
  return apiRequest<UserPublic>('/api/v1/auth/me')
}

export function registerUser(body: RegisterRequest): Promise<UserPublic> {
  return apiRequest<UserPublic>('/api/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function loginUser(body: LoginRequest): Promise<LoginResponse> {
  return apiRequest<LoginResponse>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}
