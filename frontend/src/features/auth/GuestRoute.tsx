import { useQuery } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { authQueryKeys, fetchCurrentUser } from '@/features/auth/api'

type GuestRouteProps = {
  children: ReactNode
}

export function GuestRoute({ children }: GuestRouteProps) {
  const { data: user, isPending, isError } = useQuery({
    queryKey: authQueryKeys.me,
    queryFn: fetchCurrentUser,
    retry: false,
  })

  if (isPending) {
    return (
      <div className="flex min-h-svh items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    )
  }

  if (!isError && user) {
    return <Navigate to="/" replace />
  }

  return children
}
