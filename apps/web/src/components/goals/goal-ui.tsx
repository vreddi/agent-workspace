import { api } from '@convex/_generated/api'
import type { Doc, Id } from '@convex/_generated/dataModel'
import {
  GOAL_TYPE_COLOR_TOKENS,
  parseTypeValue as parseTypeValueCore,
} from '@org/app-core'
import type { GoalTypeColorToken } from '@org/app-core'
import { Button } from '@org/ui/components/button'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@org/ui/components/select'
import { cn } from '@org/ui/lib/utils'
import { useMutation, useQuery } from 'convex/react'
import { LayoutGrid, List } from 'lucide-react'
import { useEffect, useState } from 'react'

// Pure goal view-model logic lives in @org/app-core (shared with mobile);
// re-exported here so existing web imports keep resolving through goal-ui.
export {
  DAY_MS,
  describeDeadline,
  formatCostDuration,
  formatDays,
  GOAL_TYPE_COLOR_TOKENS,
  goalTypeValue,
} from '@org/app-core'
export type { GoalTypeColorToken } from '@org/app-core'

export type ViewMode = 'card' | 'list'

// View-mode preference persisted to localStorage. Reads happen after mount so
// SSR and the first client render agree (no hydration mismatch).
export function useViewMode(
  key: string,
  initial: ViewMode = 'card',
): readonly [ViewMode, (next: ViewMode) => void] {
  const [view, setView] = useState<ViewMode>(initial)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(key)
      if (saved === 'card' || saved === 'list') setView(saved)
    } catch {
      // ignore unavailable storage (private mode, SSR)
    }
  }, [key])

  function update(next: ViewMode) {
    setView(next)
    try {
      localStorage.setItem(key, next)
    } catch {
      // ignore unavailable storage
    }
  }

  return [view, update] as const
}

// Segmented control that switches between card and list layouts.
export function ViewToggle({
  value,
  onChange,
}: {
  value: ViewMode
  onChange: (next: ViewMode) => void
}) {
  const options = [
    { value: 'card', label: 'Card view', Icon: LayoutGrid },
    { value: 'list', label: 'List view', Icon: List },
  ] as const
  return (
    <div className="inline-flex rounded-lg border p-0.5">
      {options.map(({ value: option, label, Icon }) => (
        <button
          key={option}
          type="button"
          aria-label={label}
          aria-pressed={value === option}
          onClick={() => onChange(option)}
          className={cn(
            'flex items-center justify-center rounded-md px-2 py-1 transition',
            value === option
              ? 'bg-muted text-foreground'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Icon className="size-4" />
        </button>
      ))}
    </div>
  )
}

export type GoalStatus = Doc<'goals'>['status']

export const INPUT_CLASSES = cn(
  'border-input bg-background flex h-9 min-w-0 flex-1 rounded-lg border px-3 text-sm shadow-xs outline-none',
  'placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
)

export const TEXTAREA_CLASSES = cn(
  'border-input bg-background flex min-h-[80px] w-full rounded-lg border px-3 py-2 text-sm shadow-xs outline-none',
  'placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
)

// The color tokens (GOAL_TYPE_COLOR_TOKENS / GoalTypeColorToken) come from
// @org/app-core. Their Tailwind class mapping stays here because the classes
// are spelled out — no dynamic class-string construction — so Tailwind can
// see them.
type ColorClasses = { dot: string; chip: string; swatch: string }

const GOAL_TYPE_COLOR_CLASSES: Record<GoalTypeColorToken, ColorClasses> = {
  emerald: {
    dot: 'bg-emerald-500',
    chip: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    swatch: 'bg-emerald-500',
  },
  orange: {
    dot: 'bg-orange-500',
    chip: 'border-orange-200 bg-orange-50 text-orange-700',
    swatch: 'bg-orange-500',
  },
  indigo: {
    dot: 'bg-indigo-500',
    chip: 'border-indigo-200 bg-indigo-50 text-indigo-700',
    swatch: 'bg-indigo-500',
  },
  sky: {
    dot: 'bg-sky-500',
    chip: 'border-sky-200 bg-sky-50 text-sky-700',
    swatch: 'bg-sky-500',
  },
  rose: {
    dot: 'bg-rose-500',
    chip: 'border-rose-200 bg-rose-50 text-rose-700',
    swatch: 'bg-rose-500',
  },
  amber: {
    dot: 'bg-amber-500',
    chip: 'border-amber-200 bg-amber-50 text-amber-700',
    swatch: 'bg-amber-500',
  },
  violet: {
    dot: 'bg-violet-500',
    chip: 'border-violet-200 bg-violet-50 text-violet-700',
    swatch: 'bg-violet-500',
  },
  slate: {
    dot: 'bg-slate-500',
    chip: 'border-slate-200 bg-slate-50 text-slate-700',
    swatch: 'bg-slate-500',
  },
}

export function goalTypeColorClasses(color: string): ColorClasses {
  if ((GOAL_TYPE_COLOR_TOKENS as readonly string[]).includes(color)) {
    return GOAL_TYPE_COLOR_CLASSES[color as GoalTypeColorToken]
  }
  return GOAL_TYPE_COLOR_CLASSES.slate
}

export function TypeBadge({
  type,
}: {
  type: { name: string; color: string } | null
}) {
  if (!type) return null
  const classes = goalTypeColorClasses(type.color)
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium',
        classes.chip,
      )}
    >
      <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', classes.dot)} />
      {type.name}
    </span>
  )
}

// Fallback glyphs for stub icon names (built-in types without authored art,
// and custom types). Keyed by the `icon` string stored on the type.
const STUB_ICON_EMOJI: Record<string, string> = {
  heart: '❤️',
  dumbbell: '🏋️',
  briefcase: '💼',
  'trending-up': '📈',
  users: '🤝',
  'piggy-bank': '🐷',
  'book-open': '📖',
  sprout: '🌱',
  map: '🗺️',
  sword: '⚔️',
  mountain: '⛰️',
}

// Renders a goal type's icon at a fixed square size: authored art when the
// type has an `image`, otherwise a tinted tile with a stub emoji (falling
// back to the type's first letter).
export function GoalTypeIcon({
  name,
  color,
  icon,
  image,
  size = 48,
  className,
}: {
  name: string
  color: string
  icon?: string | null
  image?: string | null
  size?: number
  className?: string
}) {
  const dimensions = { width: size, height: size }
  if (image) {
    return (
      <img
        src={image}
        alt=""
        aria-hidden
        style={dimensions}
        className={cn('shrink-0 rounded-xl object-contain', className)}
      />
    )
  }
  const classes = goalTypeColorClasses(color)
  const emoji = icon ? STUB_ICON_EMOJI[icon] : undefined
  return (
    <div
      aria-hidden
      style={dimensions}
      className={cn(
        'flex shrink-0 items-center justify-center rounded-xl border',
        classes.chip,
        className,
      )}
    >
      {emoji ? (
        <span style={{ fontSize: size * 0.42 }} className="leading-none">
          {emoji}
        </span>
      ) : (
        <span className="text-base font-semibold uppercase leading-none">
          {name.slice(0, 1)}
        </span>
      )}
    </div>
  )
}

type ResolvedTypeIcon = {
  name: string
  color: string
  icon: string | null
  image?: string | null
}

type GoalTypeList = {
  system: readonly {
    slug: string
    name: string
    color: string
    icon: string
    image?: string
  }[]
  custom: readonly Doc<'goalTypes'>[]
}

function resolveSelectionIcon(
  value: string,
  types: GoalTypeList | undefined,
): ResolvedTypeIcon | null {
  if (!value || !types) return null
  const selection = parseTypeValue(value)
  if (selection.kind === 'system') {
    const type = types.system.find((t) => t.slug === selection.slug)
    return type
      ? {
          name: type.name,
          color: type.color,
          icon: type.icon,
          image: type.image,
        }
      : null
  }
  if (selection.kind === 'custom') {
    const type = types.custom.find((t) => t._id === selection.id)
    return type
      ? { name: type.name, color: type.color, icon: type.icon, image: null }
      : null
  }
  return null
}

// Header/preview icon that reflects the goal type currently chosen in a
// GoalTypeSelect. Shows the type's art (or tinted glyph); falls back to a
// neutral dashed tile when no type is selected.
export function GoalTypeSelectionIcon({
  value,
  size = 44,
  className,
}: {
  value: string
  size?: number
  className?: string
}) {
  const types = useQuery(api.goalTypes.list, {})
  const resolved = resolveSelectionIcon(value, types)
  if (!resolved) {
    return (
      <div
        aria-hidden
        style={{ width: size, height: size }}
        className={cn(
          'flex shrink-0 items-center justify-center rounded-xl border border-dashed bg-muted/40 text-muted-foreground',
          className,
        )}
      >
        <span style={{ fontSize: size * 0.4 }} className="leading-none">
          ◎
        </span>
      </div>
    )
  }
  return (
    <GoalTypeIcon
      name={resolved.name}
      color={resolved.color}
      icon={resolved.icon}
      image={resolved.image}
      size={size}
      className={className}
    />
  )
}

export function msToDateInput(ms: number): string {
  const d = new Date(ms)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// Deadlines set via the date input land at the end of that day.
export function dateInputToMs(value: string): number | null {
  if (!value) return null
  const ms = new Date(`${value}T23:59:00`).getTime()
  return Number.isFinite(ms) ? ms : null
}

// Parse a 'YYYY-MM-DD' value into a local Date for the calendar's selection.
export function dateInputToDate(value: string): Date | undefined {
  if (!value) return undefined
  const d = new Date(`${value}T00:00:00`)
  return Number.isNaN(d.getTime()) ? undefined : d
}

// Today at local midnight — the earliest selectable deadline.
export function startOfToday(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

// Human label for a picked deadline, e.g. "Jul 4, 2026".
export function formatDeadlineLabel(value: string): string {
  const d = dateInputToDate(value)
  if (!d) return ''
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// Value encoding for the goal type select: '' = none, 'sys:<slug>',
// 'custom:<id>'. NEW_TYPE_VALUE opens the inline creator without changing
// the current selection. Radix Select forbids empty-string item values, so
// "None" is represented internally by NONE_VALUE and mapped back to ''.
const NEW_TYPE_VALUE = '__new__'
const NONE_VALUE = '__none__'

// Web-typed wrapper over the shared parser: recovers the branded goalTypes id
// so callers can pass `selection.id` straight to Convex mutations.
export function parseTypeValue(value: string) {
  return parseTypeValueCore<Id<'goalTypes'>>(value)
}

export function GoalTypeSelect({
  value,
  onChange,
  disabled,
}: {
  value: string
  onChange: (value: string) => void
  disabled: boolean
}) {
  const types = useQuery(api.goalTypes.list, {})
  const createType = useMutation(api.goalTypes.create)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState<GoalTypeColorToken>('emerald')
  const [creatingBusy, setCreatingBusy] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  async function handleCreateType() {
    const trimmed = newName.trim()
    if (!trimmed || creatingBusy) return
    setCreatingBusy(true)
    setCreateError(null)
    try {
      const id = await createType({ name: trimmed, color: newColor })
      onChange(`custom:${id}`)
      setCreating(false)
      setNewName('')
    } catch (err) {
      setCreateError(
        err instanceof Error ? err.message : 'Failed to create type',
      )
    } finally {
      setCreatingBusy(false)
    }
  }

  return (
    <div className="space-y-2">
      <Select
        value={value === '' ? NONE_VALUE : value}
        disabled={disabled || types === undefined}
        onValueChange={(next) => {
          if (next === NEW_TYPE_VALUE) {
            setCreating(true)
            return
          }
          onChange(next === NONE_VALUE ? '' : next)
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="None" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE_VALUE}>None</SelectItem>
          <SelectGroup>
            <SelectLabel>Built-in</SelectLabel>
            {(types?.system ?? []).map((t) => (
              <SelectItem key={t.slug} value={`sys:${t.slug}`}>
                {t.name}
              </SelectItem>
            ))}
          </SelectGroup>
          {types !== undefined && types.custom.length > 0 && (
            <SelectGroup>
              <SelectLabel>Custom</SelectLabel>
              {types.custom.map((t) => (
                <SelectItem key={t._id} value={`custom:${t._id}`}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectGroup>
          )}
          <SelectSeparator />
          <SelectItem value={NEW_TYPE_VALUE}>+ New type…</SelectItem>
        </SelectContent>
      </Select>

      {creating && (
        <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
          <div className="flex gap-2">
            <input
              className={INPUT_CLASSES}
              value={newName}
              disabled={creatingBusy}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Type name (e.g. Side projects)"
            />
          </div>
          <div className="flex items-center gap-2">
            {GOAL_TYPE_COLOR_TOKENS.map((token) => (
              <button
                key={token}
                type="button"
                aria-label={token}
                disabled={creatingBusy}
                onClick={() => setNewColor(token)}
                className={cn(
                  'h-6 w-6 rounded-full transition',
                  goalTypeColorClasses(token).swatch,
                  newColor === token
                    ? 'ring-2 ring-ring ring-offset-2 ring-offset-background'
                    : 'opacity-70 hover:opacity-100',
                )}
              />
            ))}
          </div>
          {createError && (
            <p className="text-xs text-destructive">{createError}</p>
          )}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={creatingBusy}
              onClick={() => {
                setCreating(false)
                setCreateError(null)
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={creatingBusy || newName.trim() === ''}
              onClick={() => {
                void handleCreateType()
              }}
            >
              {creatingBusy ? 'Creating…' : 'Create type'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
