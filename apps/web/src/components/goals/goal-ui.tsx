import { api } from '@convex/_generated/api'
import type { Doc, Id } from '@convex/_generated/dataModel'
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
import { useState } from 'react'

export const DAY_MS = 24 * 60 * 60 * 1000

export type GoalStatus = Doc<'goals'>['status']

export const INPUT_CLASSES = cn(
  'border-input bg-background flex h-9 min-w-0 flex-1 rounded-lg border px-3 text-sm shadow-xs outline-none',
  'placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
)

export const TEXTAREA_CLASSES = cn(
  'border-input bg-background flex min-h-[80px] w-full rounded-lg border px-3 py-2 text-sm shadow-xs outline-none',
  'placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
)

// Color tokens used by goal types (system types use exactly these; custom
// types are created from the same palette). Classes are spelled out — no
// dynamic class-string construction — so Tailwind can see them.
export const GOAL_TYPE_COLOR_TOKENS = [
  'emerald',
  'orange',
  'indigo',
  'sky',
  'rose',
  'amber',
  'violet',
  'slate',
] as const
export type GoalTypeColorToken = (typeof GOAL_TYPE_COLOR_TOKENS)[number]

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

export function describeDeadline(
  deadline: number,
  now: number,
): { label: string; overdue: boolean } {
  if (deadline < now) {
    const over = Math.max(1, Math.ceil((now - deadline) / DAY_MS))
    return { label: `Overdue by ${over} day${over === 1 ? '' : 's'}`, overdue: true }
  }
  const days = Math.ceil((deadline - now) / DAY_MS)
  if (days === 0) return { label: 'Due today', overdue: false }
  return { label: `${days} day${days === 1 ? '' : 's'} left`, overdue: false }
}

export function formatDays(n: number): string {
  const rounded = Math.round(n * 10) / 10
  return `${rounded}`
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

export type TypeSelection =
  | { kind: 'none' }
  | { kind: 'system'; slug: string }
  | { kind: 'custom'; id: Id<'goalTypes'> }

export function parseTypeValue(value: string): TypeSelection {
  if (value.startsWith('sys:')) return { kind: 'system', slug: value.slice(4) }
  if (value.startsWith('custom:')) {
    return { kind: 'custom', id: value.slice(7) as Id<'goalTypes'> }
  }
  return { kind: 'none' }
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
