import {
  Bell,
  Bot,
  Circle,
  GitBranch,
  Globe,
  Sparkles,
  UserCheck,
  Zap,
  type LucideIcon,
} from 'lucide-react'

import type { BuilderNodeKind } from './types'

const iconsByName: Record<string, LucideIcon> = {
  bolt: Zap,
  sparkles: Sparkles,
  robot: Bot,
  'git-branch': GitBranch,
  'world-www': Globe,
  'user-check': UserCheck,
  bell: Bell,
}

export const nodeKindIcons: Record<BuilderNodeKind, LucideIcon> = {
  trigger: Zap,
  llm: Sparkles,
  agent: Bot,
  condition: GitBranch,
  http: Globe,
  approval: UserCheck,
  notify: Bell,
}

const categoryAcronyms = new Set(['ai', 'io'])

export function nodeTypeIcon(icon: string): LucideIcon {
  return iconsByName[icon] ?? Circle
}

export function nodeKindIcon(kind: BuilderNodeKind): LucideIcon {
  return nodeKindIcons[kind]
}

export function formatNodeCategory(category: string): string {
  const value = category.trim()
  if (categoryAcronyms.has(value.toLowerCase())) {
    return value.toUpperCase()
  }
  if (value.length === 0) {
    return value
  }
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
}
