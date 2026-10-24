import { NavLink } from 'react-router-dom'

import { cn } from '@/lib/utils'

type AppBrandProps = {
  className?: string
}

export function AppBrand({ className }: AppBrandProps) {
  return (
    <NavLink
      to="/"
      title="Handoff"
      className={cn(
        'flex min-w-0 items-center gap-2.5 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring',
        'group-data-[collapsible=icon]:justify-center',
        className,
      )}
    >
      <div
        className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sm font-semibold text-sidebar-primary-foreground"
        aria-hidden
      >
        H
      </div>
      <span
        className="truncate text-lg font-semibold tracking-tight group-data-[collapsible=icon]:hidden"
      >
        Handoff
      </span>
    </NavLink>
  )
}
