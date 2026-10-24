import { useQuery } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { clearAuthSession, setAuthSession } from '@/lib/auth-storage'
import { authQueryKeys, fetchCurrentUser } from '@/features/auth/api'

type ProtectedRouteProps = {
  children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation()
  const { data: user, isPending, isError } = useQuery({
    queryKey: authQueryKeys.me,
    queryFn: fetchCurrentUser,
    retry: false,
  })

  useEffect(() => {
    if (isError) {
      clearAuthSession()
    }
  }, [isError])

  useEffect(() => {
    if (user) {
      setAuthSession(user)
    }
  }, [user])

  if (isPending) {
    return (
      <div className="flex min-h-svh items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    )
  }

  if (isError || !user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  return children
}
