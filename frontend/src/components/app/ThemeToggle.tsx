import { Check, ChevronDown, Monitor, Moon, Sun } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import type { ThemePreference } from '@/lib/theme'
import { useTheme } from '@/providers/ThemeProvider'
import { cn } from '@/lib/utils'

const options: {
  value: ThemePreference
  label: string
  icon: typeof Sun
}[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'Default', icon: Monitor },
]

type ThemeToggleProps = {
  className?: string
  /** Icon-only trigger (e.g. auth pages). */
  iconOnly?: boolean
  /** Open menu above trigger (useful at bottom of sidebar). */
  menuPlacement?: 'top' | 'bottom'
}

export function ThemeToggle({
  className,
  iconOnly = false,
  menuPlacement = 'top',
}: ThemeToggleProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const { preference, setPreference } = useTheme()
  const activeOption = options.find((option) => option.value === preference) ?? options[2]

  useEffect(() => {
    if (!open) {
      return undefined
    }

    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current?.contains(event.target as Node)) {
        return
      }
      setOpen(false)
    }

    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <Button
        type="button"
        variant="outline"
        size={iconOnly ? 'icon-sm' : 'sm'}
        className={cn(
          iconOnly ? 'size-8' : 'w-full justify-between gap-2 font-normal',
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Theme: ${activeOption.label}`}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="flex min-w-0 items-center gap-2">
          <activeOption.icon className="size-4 shrink-0" />
          {!iconOnly ? (
            <span className="truncate">{activeOption.label}</span>
          ) : null}
        </span>
        {!iconOnly ? <ChevronDown className="size-4 shrink-0 opacity-60" /> : null}
      </Button>

      {open ? (
        <ul
          role="listbox"
          aria-label="Theme options"
          className={cn(
            'absolute z-50 min-w-[10rem] rounded-lg border border-border/60 bg-popover p-1 shadow-md',
            menuPlacement === 'top' ? 'bottom-full mb-1' : 'top-full mt-1',
            iconOnly ? 'right-0' : 'inset-x-0',
          )}
        >
          {options.map((option) => {
            const selected = preference === option.value
            return (
              <li key={option.value} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted',
                    selected && 'bg-muted/60',
                  )}
                  onClick={() => {
                    setPreference(option.value)
                    setOpen(false)
                  }}
                >
                  <option.icon className="size-4 shrink-0 text-muted-foreground" />
                  <span>{option.label}</span>
                  {selected ? <Check className="ml-auto size-4" /> : null}
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}
