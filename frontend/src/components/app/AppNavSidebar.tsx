import {
  CheckSquare,
  FlaskConical,
  Home,
  KeyRound,
  Play,
  Settings,
  Workflow,
} from 'lucide-react'
import { NavLink, useMatch } from 'react-router-dom'

import { AppBrand } from '@/components/app/AppBrand'
import { SidebarCollapseToggle } from '@/components/app/SidebarCollapseToggle'
import { ThemeToggle } from '@/components/app/ThemeToggle'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'

const mainNav = [
  { title: 'Home', to: '/', icon: Home, end: true },
  { title: 'Workflows', to: '/workflows', icon: Workflow, end: false },
  { title: 'Runs', to: '/runs', icon: Play, end: false },
  {
    title: 'Approvals',
    to: '/approvals',
    icon: CheckSquare,
    end: false,
    badge: '3',
  },
  { title: 'Evals', to: '/evals', icon: FlaskConical, end: false },
  { title: 'Credentials', to: '/credentials', icon: KeyRound, end: false },
] as const

type NavItemConfig = (typeof mainNav)[number]

function NavItem({ item }: { item: NavItemConfig }) {
  const match = useMatch({ path: item.to, end: item.end })

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={Boolean(match)}
        tooltip={item.title}
        render={<NavLink to={item.to} end={item.end} />}
      >
        <item.icon className="size-4" />
        <span>{item.title}</span>
      </SidebarMenuButton>
      {'badge' in item && item.badge ? (
        <SidebarMenuBadge className="bg-red-500 text-white">{item.badge}</SidebarMenuBadge>
      ) : null}
    </SidebarMenuItem>
  )
}

function SettingsNavItem() {
  const match = useMatch({ path: '/settings', end: true })

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={Boolean(match)}
        tooltip="Settings"
        render={<NavLink to="/settings" />}
      >
        <Settings className="size-4" />
        <span>Settings</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

export function AppNavSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader
        className="flex flex-row items-center gap-2 border-b border-sidebar-border px-2 py-2 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:gap-2 group-data-[collapsible=icon]:py-3"
      >
        <div className="flex min-w-0 flex-1 items-center px-1 group-data-[collapsible=icon]:flex-none group-data-[collapsible=icon]:px-0">
          <AppBrand />
        </div>
        <SidebarCollapseToggle className="shrink-0 group-data-[collapsible=icon]:size-8" />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <NavItem key={item.to} item={item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border gap-2 p-2">
        <div className="px-1 group-data-[collapsible=icon]:hidden">
          <ThemeToggle className="w-full" menuPlacement="top" />
        </div>
        <div className="hidden justify-center px-1 group-data-[collapsible=icon]:flex">
          <ThemeToggle iconOnly menuPlacement="top" />
        </div>
        <SidebarMenu>
          <SettingsNavItem />
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
