import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { getMutationErrorMessage } from '@/lib/mutation-error'
import { AuthPageShell } from '@/features/auth/AuthPageShell'
import { FormField } from '@/features/auth/FormField'
import { PasswordFormField } from '@/features/auth/PasswordFormField'
import { useRegisterMutation } from '@/features/auth/hooks'
import {
  registerSchema,
  type RegisterFormValues,
} from '@/features/auth/schemas'

export function RegisterPage() {
  const navigate = useNavigate()
  const registerMutation = useRegisterMutation()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      password: '',
      password_confirm: '',
    },
  })

  const apiError = getMutationErrorMessage(registerMutation.error)

  function onSubmit(values: RegisterFormValues) {
    registerMutation.mutate(values, {
      onSuccess: (_user, variables) => {
        navigate('/login', {
          replace: true,
          state: { registeredEmail: variables.email },
        })
      },
    })
  }

  return (
    <AuthPageShell
      title="Create account"
      description="Register to start building agentic workflows."
      footer={
        <>
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </>
      }
    >
      <form
        className="space-y-4"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <div className="grid grid-cols-2 gap-3">
          <FormField
            label="First name"
            autoComplete="given-name"
            registration={register('first_name')}
            error={errors.first_name?.message}
          />
          <FormField
            label="Last name"
            autoComplete="family-name"
            registration={register('last_name')}
            error={errors.last_name?.message}
          />
        </div>
        <FormField
          label="Email"
          type="email"
          autoComplete="email"
          registration={register('email')}
          error={errors.email?.message}
        />
        <PasswordFormField
          label="Password"
          autoComplete="new-password"
          registration={register('password')}
          error={errors.password?.message}
          hint="At least 8 characters"
        />
        <PasswordFormField
          label="Confirm password"
          autoComplete="new-password"
          registration={register('password_confirm')}
          error={errors.password_confirm?.message}
        />
        {apiError ? (
          <p className="text-sm text-destructive" role="alert">
            {apiError}
          </p>
        ) : null}
        <Button
          type="submit"
          className="w-full"
          disabled={registerMutation.isPending}
        >
          {registerMutation.isPending ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
    </AuthPageShell>
  )
}
