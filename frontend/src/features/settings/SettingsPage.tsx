import { ThemeToggle } from '@/components/app/ThemeToggle'
import { useTheme } from '@/providers/ThemeProvider'

export function SettingsPage() {
  const { preference, resolvedScheme } = useTheme()

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 p-6 md:p-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Customize how Handoff looks on your device.
        </p>
      </header>

      <section className="rounded-xl border border-border/60 bg-card p-5">
        <h2 className="text-sm font-medium">Appearance</h2>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Light, dark, or match your system (default).
          </p>
          <ThemeToggle className="w-full sm:w-44" menuPlacement="bottom" />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Preference: <span className="font-medium text-foreground">{preference}</span>
          {' · '}
          Currently showing:{' '}
          <span className="font-medium text-foreground">{resolvedScheme}</span>
        </p>
      </section>
    </div>
  )
}
