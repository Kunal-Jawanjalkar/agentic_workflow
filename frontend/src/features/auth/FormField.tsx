import type { HTMLInputTypeAttribute, ReactNode } from 'react'
import type { UseFormRegisterReturn } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type FormFieldProps = {
  label: string
  registration: UseFormRegisterReturn
  type?: HTMLInputTypeAttribute
  autoComplete?: string
  error?: string
  hint?: ReactNode
}

export function FormField({
  label,
  registration,
  type = 'text',
  autoComplete,
  error,
  hint,
}: FormFieldProps) {
  const id = registration.name

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <Input
        id={id}
        type={type}
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        aria-describedby={
          error ? `${id}-error` : hint ? `${id}-hint` : undefined
        }
        {...registration}
      />
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
