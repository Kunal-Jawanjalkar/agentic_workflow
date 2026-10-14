import { AppSidebar } from '@/components/app/AppSidebar'
import { Separator } from '@/components/ui/separator'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { WorkflowCanvas } from '@/features/canvas/WorkflowCanvas'

export function WorkflowLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex h-svh flex-col overflow-hidden">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <Separator
            orientation="vertical"
            className="mr-1 data-[orientation=vertical]:h-4"
          />
          <h1 className="text-sm font-medium">Untitled workflow</h1>
        </header>
        <div className="relative min-h-0 flex-1">
          <WorkflowCanvas />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
