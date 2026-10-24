import {
  Bot,
  GitBranch,
  Globe,
  Play,
  Zap,
} from 'lucide-react'

const nodePalette = [
  { title: 'Manual trigger', icon: Play, description: 'Start a run on demand' },
  { title: 'Webhook', icon: Zap, description: 'HTTP event trigger' },
  { title: 'HTTP request', icon: Globe, description: 'Call an external API' },
  { title: 'AI agent', icon: Bot, description: 'LLM step with tools' },
  { title: 'Branch', icon: GitBranch, description: 'Conditional routing' },
] as const

export function NodePalettePanel() {
  return (
    <aside
      className="hidden w-56 shrink-0 border-r border-border/60 bg-card/40 lg:block"
      aria-label="Node palette"
    >
      <div className="border-b border-border/60 px-4 py-3 text-xs font-medium text-muted-foreground">
        Nodes
      </div>
      <ul className="space-y-1 p-2">
        {nodePalette.map((item) => (
          <li key={item.title}>
            <button
              type="button"
              className="flex w-full flex-col items-start gap-0.5 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted/60"
            >
              <span className="flex items-center gap-2 font-medium">
                <item.icon className="size-4 shrink-0 text-muted-foreground" />
                {item.title}
              </span>
              <span className="pl-6 text-xs text-muted-foreground">{item.description}</span>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  )
}
