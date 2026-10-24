import { PanelLeft, PanelLeftClose } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useSidebar } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

type SidebarCollapseToggleProps = {
  className?: string
}

export function SidebarCollapseToggle({ className }: SidebarCollapseToggleProps) {
  const { state, toggleSidebar } = useSidebar()
  const collapsed = state === 'collapsed'

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className={cn('shrink-0 text-muted-foreground', className)}
      aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      aria-expanded={!collapsed}
      onClick={toggleSidebar}
    >
      {collapsed ? <PanelLeft className="size-4" /> : <PanelLeftClose className="size-4" />}
    </Button>
  )
}
