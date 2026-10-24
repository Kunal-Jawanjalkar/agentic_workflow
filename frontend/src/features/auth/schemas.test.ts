import { describe, expect, it } from 'vitest'

import { loginSchema, registerSchema } from './schemas'

describe('loginSchema', () => {
  it('accepts valid email and password', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'secret',
    })

    expect(result.success).toBe(true)
  })

  it('rejects empty password', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: '',
    })

    expect(result.success).toBe(false)
  })

  it('rejects invalid email', () => {
    const result = loginSchema.safeParse({
      email: 'not-email',
      password: 'secret',
    })

    expect(result.success).toBe(false)
  })
})

describe('registerSchema', () => {
  const valid = {
    first_name: 'Ada',
    last_name: 'Lovelace',
    email: 'ada@example.com',
    password: 'password123',
    password_confirm: 'password123',
  }

  it('accepts valid registration payload', () => {
    expect(registerSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects password shorter than 8 characters', () => {
    const result = registerSchema.safeParse({
      ...valid,
      password: 'short',
      password_confirm: 'short',
    })

    expect(result.success).toBe(false)
  })

  it('rejects mismatched passwords', () => {
    const result = registerSchema.safeParse({
      ...valid,
      password_confirm: 'different-password',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('password_confirm'))).toBe(
        true,
      )
    }
  })

  it('trims first and last name', () => {
    const result = registerSchema.safeParse({
      ...valid,
      first_name: '  Ada  ',
      last_name: '  Lovelace  ',
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.first_name).toBe('Ada')
      expect(result.data.last_name).toBe('Lovelace')
    }
  })
})
