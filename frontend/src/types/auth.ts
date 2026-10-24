export type RegisterRequest = {
  email: string
  password: string
  first_name: string
  last_name: string
}

export type LoginRequest = {
  email: string
  password: string
}

export type UserPublic = {
  id: string
  email: string
  first_name: string
  last_name: string
  created_at: string
}

export type LoginResponse = {
  user: UserPublic
}
