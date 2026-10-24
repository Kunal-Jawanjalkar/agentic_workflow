import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { setAuthSession } from '@/lib/auth-storage'
import { getMutationErrorMessage } from '@/lib/mutation-error'
import { AuthPageShell } from '@/features/auth/AuthPageShell'
import { FormField } from '@/features/auth/FormField'
import { PasswordFormField } from '@/features/auth/PasswordFormField'
import { useLoginMutation } from '@/features/auth/hooks'
import { loginSchema, type LoginFormValues } from '@/features/auth/schemas'

type LoginLocationState = {
  registeredEmail?: string
}

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const registeredEmail = (location.state as LoginLocationState | null)
    ?.registeredEmail
  const registrationMessage = registeredEmail
    ? 'Account created. Sign in with your email and password.'
    : null

  const loginMutation = useLoginMutation()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: registeredEmail ?? '',
      password: '',
    },
  })

  const apiError = getMutationErrorMessage(loginMutation.error)

  function onSubmit(values: LoginFormValues) {
    loginMutation.mutate(values, {
      onSuccess: (response) => {
        setAuthSession(response.user)
        navigate('/', { replace: true })
      },
    })
  }

  return (
    <AuthPageShell
      title="Sign in"
      description="Use your email and password to access your workflows."
      footer={
        <>
          Don&apos;t have an account?{' '}
          <Link
            to="/register"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Create one
          </Link>
        </>
      }
    >
      <form
        className="space-y-4"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <FormField
          label="Email"
          type="email"
          autoComplete="email"
          registration={register('email')}
          error={errors.email?.message}
        />
        <PasswordFormField
          label="Password"
          autoComplete="current-password"
          registration={register('password')}
          error={errors.password?.message}
        />
        {registrationMessage ? (
          <p className="text-sm text-muted-foreground" role="status">
            {registrationMessage}
          </p>
        ) : null}
        {apiError ? (
          <p className="text-sm text-destructive" role="alert">
            {apiError}
          </p>
        ) : null}
        <Button
          type="submit"
          className="w-full"
          disabled={loginMutation.isPending}
        >
          {loginMutation.isPending ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </AuthPageShell>
  )
}
