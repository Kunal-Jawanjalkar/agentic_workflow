import {
  Bot,
  GitBranch,
  Globe,
  Play,
  Workflow,
  Zap,
} from 'lucide-react'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import { ScrollArea } from '@/components/ui/scroll-area'

const nodePalette = [
  { title: 'Manual trigger', icon: Play, description: 'Start a run on demand' },
  { title: 'Webhook', icon: Zap, description: 'HTTP event trigger' },
  { title: 'HTTP request', icon: Globe, description: 'Call an external API' },
  { title: 'AI agent', icon: Bot, description: 'LLM step with tools' },
  { title: 'Branch', icon: GitBranch, description: 'Conditional routing' },
] as const

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="pointer-events-none">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Workflow className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">Agentic Flow</span>
                <span className="truncate text-xs text-muted-foreground">
                  Workflow builder
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <ScrollArea className="h-full">
          <SidebarGroup>
            <SidebarGroupLabel>Nodes</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {nodePalette.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      type="button"
                      className="h-auto flex-col items-start gap-1 py-2"
                      tooltip={item.description}
                    >
                      <span className="flex w-full items-center gap-2">
                        <item.icon className="size-4 shrink-0" />
                        <span className="font-medium">{item.title}</span>
                      </span>
                      <span className="w-full pl-6 text-left text-xs text-muted-foreground">
                        {item.description}
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </ScrollArea>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-2 text-xs text-muted-foreground">
        Drag nodes onto the canvas (coming soon)
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
