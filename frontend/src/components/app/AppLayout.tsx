import { Outlet } from 'react-router-dom'

import { AppNavSidebar } from '@/components/app/AppNavSidebar'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'

export function AppLayout() {
  return (
    <SidebarProvider>
      <AppNavSidebar />
      <SidebarInset className="flex min-h-svh flex-col bg-background">
        <div className="flex h-11 shrink-0 items-center border-b border-border/60 px-3 md:hidden">
          <SidebarTrigger className="text-muted-foreground" />
        </div>
        <main className="min-h-0 flex-1 overflow-auto">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
