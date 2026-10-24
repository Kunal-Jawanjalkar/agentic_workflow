import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import type { ReactNode } from 'react'
import type { UseFormRegisterReturn } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type PasswordFormFieldProps = {
  label: string
  registration: UseFormRegisterReturn
  autoComplete?: string
  error?: string
  hint?: ReactNode
}

export function PasswordFormField({
  label,
  registration,
  autoComplete,
  error,
  hint,
}: PasswordFormFieldProps) {
  const [visible, setVisible] = useState(false)
  const id = registration.name

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        <Input
          id={id}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          className="pr-9"
          aria-invalid={error ? true : undefined}
          aria-describedby={
            error ? `${id}-error` : hint ? `${id}-hint` : undefined
          }
          {...registration}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="absolute top-1/2 right-1 -translate-y-1/2 text-muted-foreground"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
        >
          {visible ? <EyeOff /> : <Eye />}
        </Button>
      </div>
      {hint ? (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p
          id={`${id}-error`}
          className={cn('text-xs text-destructive')}
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </div>
  )
}
