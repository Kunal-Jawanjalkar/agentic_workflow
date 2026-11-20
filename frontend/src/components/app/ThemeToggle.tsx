import { Check, ChevronDown, Monitor, Moon, Sun } from 'lucide-react'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

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
  /** Expand menu to the right of the icon trigger (narrow collapsed sidebar). */
  menuAlign?: 'inset' | 'expand'
}

type MenuCoords = {
  left: number
  top: number
}

export function ThemeToggle({
  className,
  iconOnly = false,
  menuPlacement = 'top',
  menuAlign = 'inset',
}: ThemeToggleProps) {
  const [open, setOpen] = useState(false)
  const [menuCoords, setMenuCoords] = useState<MenuCoords | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLUListElement>(null)
  const { preference, setPreference } = useTheme()
  const activeOption = options.find((option) => option.value === preference) ?? options[2]
  const usePortal = iconOnly && menuAlign === 'expand'

  const updateMenuPosition = useCallback(() => {
    const trigger = triggerRef.current
    const menu = menuRef.current
    if (!trigger || !menu) {
      return
    }
    const triggerRect = trigger.getBoundingClientRect()
    const menuHeight = menu.offsetHeight
    const menuWidth = menu.offsetWidth
    const gap = 8
    const viewportPadding = 8

    let left = triggerRect.right + gap
    if (left + menuWidth > window.innerWidth - viewportPadding) {
      left = triggerRect.left - menuWidth - gap
    }

    let top =
      menuPlacement === 'top'
        ? triggerRect.top - menuHeight - gap
        : triggerRect.bottom + gap

    if (top < viewportPadding) {
      top = triggerRect.bottom + gap
    }
    if (top + menuHeight > window.innerHeight - viewportPadding) {
      top = Math.max(viewportPadding, triggerRect.top - menuHeight - gap)
    }

    setMenuCoords({ left, top })
  }, [menuPlacement])

  useLayoutEffect(() => {
    if (!open || !usePortal) {
      return
    }
    updateMenuPosition()
    const frame = requestAnimationFrame(updateMenuPosition)
    return () => cancelAnimationFrame(frame)
  }, [open, usePortal, updateMenuPosition])

  useEffect(() => {
    if (!open) {
      return undefined
    }

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return
      }
      setOpen(false)
    }

    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  useEffect(() => {
    if (!open || !usePortal) {
      return undefined
    }

    const onReposition = () => updateMenuPosition()
    window.addEventListener('resize', onReposition)
    window.addEventListener('scroll', onReposition, true)
    return () => {
      window.removeEventListener('resize', onReposition)
      window.removeEventListener('scroll', onReposition, true)
    }
  }, [open, usePortal, updateMenuPosition])

  const menuClassName = cn(
    'z-50 min-w-[10rem] rounded-lg border border-border/60 bg-popover p-1 shadow-md',
    usePortal ? 'fixed' : 'absolute',
    !usePortal && (menuPlacement === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'),
    !usePortal &&
      (menuAlign === 'expand' && iconOnly ? 'left-full ml-2' : iconOnly ? 'left-0' : 'inset-x-0'),
  )

  const menu = open ? (
    <ul
      ref={menuRef}
      role="listbox"
      aria-label="Theme options"
      className={menuClassName}
      style={
        usePortal
          ? {
              left: menuCoords?.left ?? -9999,
              top: menuCoords?.top ?? -9999,
              visibility: menuCoords ? 'visible' : 'hidden',
            }
          : undefined
      }
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
  ) : null

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <div ref={triggerRef} className={cn(iconOnly ? 'inline-flex' : 'block w-full')}>
      <Button
        type="button"
        variant="outline"
        size={iconOnly ? 'icon-sm' : 'sm'}
        className={cn(
          iconOnly
            ? 'size-8 shrink-0 border-sidebar-border bg-sidebar text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
            : 'w-full justify-between gap-2 font-normal',
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
      </div>

      {usePortal && menu ? createPortal(menu, document.body) : menu}
    </div>
  )
}