import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { ThemeToggle } from '@/components/app/ThemeToggle'

type AuthPageShellProps = {
  title: string
  description: string
  children: ReactNode
  footer: ReactNode
}

export function AuthPageShell({
  title,
  description,
  children,
  footer,
}: AuthPageShellProps) {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center bg-muted/40 px-4 py-12">
      <div className="absolute top-4 right-4">
        <ThemeToggle iconOnly menuPlacement="bottom" />
      </div>
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <Link
            to="/"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Agentic Workflow
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
          {children}
        </div>
        <p className="text-center text-sm text-muted-foreground">{footer}</p>
      </div>
    </div>
  )
}
