import type { Id } from '@convex/_generated/dataModel'
import {
  ESTIMATE_UNIT_LABELS,
  ESTIMATE_UNITS,
  type EstimateUnit,
  estimateToMinutes,
  fmtEstimate,
} from '@org/app-core'
import { Calendar } from '@org/ui/components/calendar'
import { Checkbox } from '@org/ui/components/checkbox'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@org/ui/components/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@org/ui/components/select'
import { Slider } from '@org/ui/components/slider'
import { type FormEvent, useEffect, useRef, useState } from 'react'
import { GoalTypeSelectionIcon, goalTypeValue } from '../goals/goal-ui'
import { PRIORITY_LABELS, type TaskPriority } from '../tasks/priority'
import { TargetDateInfo } from '../tasks/target-date-info'
import { EmojiGlyphButton } from './emoji-picker'

export type CaptureInput = {
  title: string
  estimateMinutes: number | null
  targetDate: string | null
  allowEarlyCompletion: boolean
  /** Long-running task: start tracking % progress (at 0). */
  trackProgress: boolean
  scheduledStartMinutes: number | null
  priority: TaskPriority | null
  difficulty: number | null
  emoji: string | null
  goalId: Id<'goals'> | null
}

const SLOT_STEP = 15
const SLOT_MAX = 24 * 60 - SLOT_STEP
const SLOT_DEFAULT = 9 * 60
const DEFAULT_SLOT_LENGTH = 30

const DIFFICULTY_WORDS: Record<number, string> = {
  1: 'Breezy',
  2: 'Easy',
  3: 'Moderate',
  4: 'Tough',
  5: 'Challenging',
}

function toDateString(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function todayDateString(): string {
  return toDateString(new Date())
}

/** Parse YYYY-MM-DD as a local date (Date-only strings parse as UTC). */
function parseDateString(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1)
}

function addDays(dateStr: string, days: number): string {
  const d = parseDateString(dateStr)
  d.setDate(d.getDate() + days)
  return toDateString(d)
}

/** "Today", "Tomorrow", or "Mon, Jul 7" for a YYYY-MM-DD string. */
function fmtTargetDate(dateStr: string): string {
  const today = todayDateString()
  if (dateStr === today) return 'Today'
  if (dateStr === addDays(today, 1)) return 'Tomorrow'
  return parseDateString(dateStr).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

/** Minutes after midnight → "9 AM" / "1:30 PM". */
function fmtSlotTime(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24
  const m = minutes % 60
  const ampm = h < 12 ? 'AM' : 'PM'
  const hh = h % 12 === 0 ? 12 : h % 12
  return m === 0
    ? `${hh} ${ampm}`
    : `${hh}:${String(m).padStart(2, '0')} ${ampm}`
}

export type GoalOption = {
  _id: Id<'goals'>
  title: string
  typeSlug: string | null
  customTypeId: Id<'goalTypes'> | null
}

// Small leading tile for a goal row. Uses the same resolver as the goal
// detail header (authored type art, tinted glyph, or a neutral dashed
// placeholder) so the dropdown shows the goal's exact icon.
function GoalOptIcon({ goal }: { goal: GoalOption | null }) {
  return (
    <GoalTypeSelectionIcon
      value={goal ? goalTypeValue(goal) : ''}
      size={20}
      className="t-goalpick__icon"
    />
  )
}

// Radix Select forbids empty-string item values, so "No goal" gets a
// sentinel that maps back to null.
const NO_GOAL_VALUE = '__none__'

function GoalPicker({
  goals,
  value,
  disabled,
  onSelect,
}: {
  goals: GoalOption[] | undefined
  value: Id<'goals'> | null
  disabled: boolean
  onSelect: (goalId: Id<'goals'> | null) => void
}) {
  return (
    <Select
      value={value ?? NO_GOAL_VALUE}
      disabled={disabled || goals === undefined}
      onValueChange={(next) =>
        onSelect(next === NO_GOAL_VALUE ? null : (next as Id<'goals'>))
      }
    >
      <SelectTrigger
        className="w-full"
        data-empty={value === null ? true : undefined}
        aria-label="Goal"
      >
        <SelectValue placeholder="No goal" />
      </SelectTrigger>
      <SelectContent
        className="z-[70]"
        // Dismiss only the dropdown, not the whole capture palette.
        onEscapeKeyDown={(e) => e.stopPropagation()}
      >
        <SelectItem value={NO_GOAL_VALUE}>
          <GoalOptIcon goal={null} />
          No goal
        </SelectItem>
        {goals?.map((g) => (
          <SelectItem key={g._id} value={g._id}>
            <GoalOptIcon goal={g} />
            {g.title}
          </SelectItem>
        ))}
        {goals && goals.length === 0 && (
          <div className="t-goalpick__empty">No active goals yet.</div>
        )}
      </SelectContent>
    </Select>
  )
}

const PRIORITY_CHOICES: { value: TaskPriority | null; label: string }[] = [
  { value: null, label: 'None' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
]

function TargetDatePicker({
  value,
  disabled,
  onChange,
}: {
  value: string
  disabled: boolean
  onChange: (next: string) => void
}) {
  const [open, setOpen] = useState(false)
  const today = todayDateString()
  return (
    <div className="t-palette__date">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="t-palette__date-btn"
            data-empty={value ? undefined : true}
            disabled={disabled}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
            {value ? fmtTargetDate(value) : 'No date'}
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="z-[60] w-auto p-0"
          align="start"
          onEscapeKeyDown={(e) => e.stopPropagation()}
        >
          <Calendar
            mode="single"
            selected={value ? parseDateString(value) : undefined}
            defaultMonth={value ? parseDateString(value) : undefined}
            onSelect={(day) => {
              onChange(day ? toDateString(day) : '')
              setOpen(false)
            }}
          />
        </PopoverContent>
      </Popover>
      {value !== today && (
        <button
          type="button"
          className="t-palette__chip"
          onClick={() => onChange(today)}
          disabled={disabled}
        >
          Today
        </button>
      )}
      {value !== addDays(today, 1) && (
        <button
          type="button"
          className="t-palette__chip"
          onClick={() => onChange(addDays(today, 1))}
          disabled={disabled}
        >
          Tomorrow
        </button>
      )}
      {value !== '' && (
        <button
          type="button"
          className="t-palette__chip t-palette__chip--ghost"
          onClick={() => onChange('')}
          disabled={disabled}
          aria-label="Clear target date"
        >
          Clear
        </button>
      )}
    </div>
  )
}

/**
 * Quick-capture palette: a title is all it takes, with an optional
 * "fine-tune" drawer for scheduling, priority, difficulty, and goal.
 * Rendered inside `.today-root`, so it needs `todayStyles` on the page.
 */
export function CapturePalette({
  open,
  goals,
  onClose,
  onSubmit,
}: {
  open: boolean
  goals: GoalOption[] | undefined
  onClose: () => void
  onSubmit: (input: CaptureInput) => Promise<void>
}) {
  const [val, setVal] = useState('')
  const [estimate, setEstimate] = useState('')
  const [estimateUnit, setEstimateUnit] = useState<EstimateUnit>('minutes')
  const [targetDate, setTargetDate] = useState('')
  const [allowEarlyCompletion, setAllowEarlyCompletion] = useState(false)
  const [trackProgress, setTrackProgress] = useState(false)
  const [slotStart, setSlotStart] = useState<number | null>(null)
  const [priority, setPriority] = useState<TaskPriority | null>(null)
  const [difficulty, setDifficulty] = useState<number | null>(null)
  const [emoji, setEmoji] = useState<string | null>(null)
  const [goalId, setGoalId] = useState<Id<'goals'> | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  useEffect(() => {
    if (open) {
      setVal('')
      setEstimate('')
      setEstimateUnit('minutes')
      setTargetDate('')
      setAllowEarlyCompletion(false)
      setTrackProgress(false)
      setSlotStart(null)
      setPriority(null)
      setDifficulty(null)
      setEmoji(null)
      setGoalId(null)
      setDetailsOpen(false)
      setError(null)
      setSubmitting(false)
      window.requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])
  if (!open) return null

  const estimateMinutesOrNull = (() => {
    const trimmed = estimate.trim()
    if (trimmed === '') return null
    const n = Number(trimmed)
    return Number.isFinite(n) && n > 0
      ? estimateToMinutes(n, estimateUnit)
      : null
  })()
  // A time slot's end is derived from the estimate, so the slider only makes
  // sense once we know how long the task takes.
  const hasEstimate = estimateMinutesOrNull !== null
  const slotLength = estimateMinutesOrNull ?? DEFAULT_SLOT_LENGTH
  const slotEnd =
    slotStart === null ? null : Math.min(slotStart + slotLength, 24 * 60)

  async function handleSubmit(e?: FormEvent) {
    e?.preventDefault()
    const trimmed = val.trim()
    if (!trimmed || submitting) return
    const trimmedEstimate = estimate.trim()
    let estimateMinutes: number | null = null
    if (trimmedEstimate !== '') {
      const n = Number(trimmedEstimate)
      if (!Number.isFinite(n) || n < 0) {
        setError('Estimate must be a positive number.')
        return
      }
      estimateMinutes = estimateToMinutes(n, estimateUnit)
    }
    setError(null)
    setSubmitting(true)
    try {
      await onSubmit({
        title: trimmed,
        estimateMinutes,
        targetDate: targetDate || null,
        // The flag only means anything once a target date is set.
        allowEarlyCompletion: targetDate ? allowEarlyCompletion : false,
        trackProgress,
        // A slot only means something on a concrete day.
        scheduledStartMinutes: targetDate ? slotStart : null,
        priority,
        difficulty,
        emoji,
        goalId,
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task')
    } finally {
      setSubmitting(false)
    }
  }

  const summaryChips: { key: string; label: string; dot?: TaskPriority }[] = []
  if (targetDate) {
    summaryChips.push({
      key: 'date',
      label:
        slotStart === null
          ? fmtTargetDate(targetDate)
          : `${fmtTargetDate(targetDate)} · ${fmtSlotTime(slotStart)}`,
    })
  }
  if (estimateMinutesOrNull !== null) {
    summaryChips.push({
      key: 'estimate',
      label: fmtEstimate(estimateMinutesOrNull),
    })
  }
  if (priority !== null) {
    summaryChips.push({
      key: 'priority',
      label: `${PRIORITY_LABELS[priority]} priority`,
      dot: priority,
    })
  }
  if (difficulty !== null) {
    summaryChips.push({
      key: 'difficulty',
      label: `Difficulty ${difficulty}/5`,
    })
  }
  if (trackProgress) {
    summaryChips.push({ key: 'progress', label: 'Long-running' })
  }
  const selectedGoal = goals?.find((g) => g._id === goalId)
  if (selectedGoal) {
    summaryChips.push({ key: 'goal', label: selectedGoal.title })
  }

  return (
    <div
      className="t-palette-bd"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose()
      }}
    >
      <form
        className="t-palette"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <div className="t-palette__row">
          <EmojiGlyphButton
            value={emoji}
            disabled={submitting}
            onSelect={setEmoji}
          />
          <input
            ref={inputRef}
            className="t-palette__input"
            value={val}
            disabled={submitting}
            onChange={(e) => setVal(e.target.value)}
            placeholder="What needs doing?"
          />
          <button
            type="submit"
            className="t-palette__enter"
            disabled={!val.trim() || submitting}
            aria-label="Add task"
            title="Add task (Enter)"
          >
            <span className="t-kbd">↵</span>
          </button>
        </div>

        <div className="t-palette__more">
          <button
            type="button"
            className="t-palette__more-toggle"
            aria-expanded={detailsOpen}
            onClick={() => setDetailsOpen((o) => !o)}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
            {detailsOpen ? 'Hide details' : 'Fine-tune'}
          </button>
          {!detailsOpen && summaryChips.length > 0 && (
            <div className="t-palette__summary">
              {summaryChips.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  className="t-palette__sum-chip"
                  onClick={() => setDetailsOpen(true)}
                >
                  {chip.dot && (
                    <span className={`t-prio-dot t-prio-dot--${chip.dot}`} />
                  )}
                  {chip.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {detailsOpen && (
          <div className="t-palette__details">
            <section className="t-palette__section">
              <div className="t-palette__section-head">Scheduling</div>
              <div className="t-palette__grid">
                <div className="t-palette__field">
                  <span className="t-palette__label t-palette__label--info">
                    Target date
                    <TargetDateInfo />
                  </span>
                  <TargetDatePicker
                    value={targetDate}
                    disabled={submitting}
                    onChange={(next) => {
                      setTargetDate(next)
                      if (next === '') setSlotStart(null)
                    }}
                  />
                </div>
                <label className="t-palette__field t-palette__field--narrow">
                  <span className="t-palette__label">Estimate</span>
                  <div className="t-palette__field-input">
                    <input
                      type="number"
                      min={0}
                      step="any"
                      inputMode="decimal"
                      disabled={submitting}
                      value={estimate}
                      onChange={(e) => {
                        const next = e.target.value
                        setEstimate(next)
                        // Without a valid estimate the slot length is unknown,
                        // so drop any chosen start time.
                        const n = Number(next.trim())
                        if (
                          !(next.trim() !== '' && Number.isFinite(n) && n > 0)
                        ) {
                          setSlotStart(null)
                        }
                      }}
                      placeholder="—"
                    />
                    <select
                      className="t-palette__unit"
                      aria-label="Estimate unit"
                      disabled={submitting}
                      value={estimateUnit}
                      onChange={(e) =>
                        setEstimateUnit(e.target.value as EstimateUnit)
                      }
                    >
                      {ESTIMATE_UNITS.map((unit) => (
                        <option key={unit} value={unit}>
                          {ESTIMATE_UNIT_LABELS[unit]}
                        </option>
                      ))}
                    </select>
                  </div>
                </label>
              </div>
              {targetDate !== '' && (
                <label className="t-palette__check">
                  <Checkbox
                    checked={allowEarlyCompletion}
                    disabled={submitting}
                    onCheckedChange={(next) =>
                      setAllowEarlyCompletion(next === true)
                    }
                  />
                  <span>OK to finish before the target date</span>
                </label>
              )}
              <label className="t-palette__check">
                <Checkbox
                  checked={trackProgress}
                  disabled={submitting}
                  onCheckedChange={(next) => setTrackProgress(next === true)}
                />
                <span>Long-running — track % progress across sittings</span>
              </label>
              {targetDate !== '' && (
                <div className="t-palette__slot">
                  <div className="t-palette__slot-head">
                    <span className="t-palette__label">Time slot</span>
                    <span className="t-palette__slot-value">
                      {!hasEstimate
                        ? 'Set an estimate first'
                        : slotStart === null || slotEnd === null
                          ? 'Anytime'
                          : `${fmtSlotTime(slotStart)} – ${fmtSlotTime(slotEnd)}`}
                    </span>
                    {hasEstimate && slotStart !== null && (
                      <button
                        type="button"
                        className="t-palette__chip t-palette__chip--ghost"
                        disabled={submitting}
                        onClick={() => setSlotStart(null)}
                      >
                        Anytime
                      </button>
                    )}
                  </div>
                  <div
                    data-unset={
                      !hasEstimate || slotStart === null ? true : undefined
                    }
                  >
                    <Slider
                      min={0}
                      max={SLOT_MAX}
                      step={SLOT_STEP}
                      disabled={submitting || !hasEstimate}
                      value={[slotStart ?? SLOT_DEFAULT]}
                      onValueChange={([v]) => setSlotStart(v ?? SLOT_DEFAULT)}
                      aria-label="Time slot start"
                    />
                  </div>
                  <div className="t-palette__scale">
                    <span>12 AM</span>
                    <span>6 AM</span>
                    <span>12 PM</span>
                    <span>6 PM</span>
                    <span>12 AM</span>
                  </div>
                </div>
              )}
            </section>

            <section className="t-palette__section">
              <div className="t-palette__section-head">Priority & effort</div>
              <div className="t-palette__grid">
                <div className="t-palette__field t-palette__field--narrow">
                  <span className="t-palette__label">Priority</span>
                  <div
                    className="t-seg"
                    role="radiogroup"
                    aria-label="Priority"
                  >
                    {PRIORITY_CHOICES.map((choice) => (
                      <button
                        key={choice.label}
                        type="button"
                        role="radio"
                        aria-checked={priority === choice.value}
                        data-active={
                          priority === choice.value ? true : undefined
                        }
                        disabled={submitting}
                        onClick={() => setPriority(choice.value)}
                      >
                        {choice.value && (
                          <span
                            className={`t-prio-dot t-prio-dot--${choice.value}`}
                          />
                        )}
                        {choice.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="t-palette__field">
                  <span className="t-palette__label">Difficulty</span>
                  <div className="t-palette__slot">
                    <div className="t-palette__slot-head">
                      <span className="t-palette__slot-value">
                        {difficulty === null
                          ? 'Not set'
                          : `${difficulty}/5 · ${DIFFICULTY_WORDS[difficulty]}`}
                      </span>
                      {difficulty !== null && (
                        <button
                          type="button"
                          className="t-palette__chip t-palette__chip--ghost"
                          disabled={submitting}
                          onClick={() => setDifficulty(null)}
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <div data-unset={difficulty === null ? true : undefined}>
                      <Slider
                        min={1}
                        max={5}
                        step={1}
                        disabled={submitting}
                        value={[difficulty ?? 3]}
                        onValueChange={([v]) => setDifficulty(v ?? 3)}
                        aria-label="Difficulty"
                      />
                    </div>
                    <div className="t-palette__scale">
                      <span>Easy</span>
                      <span>Challenging</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="t-palette__section">
              <div className="t-palette__section-head">Goal</div>
              <GoalPicker
                goals={goals}
                value={goalId}
                disabled={submitting}
                onSelect={setGoalId}
              />
            </section>
          </div>
        )}

        {error && <div className="t-palette__error">{error}</div>}
        <div className="t-palette__hints">
          <span>A title is enough — everything else is optional.</span>
          <button
            type="submit"
            className="t-palette__save"
            disabled={!val.trim() || submitting}
          >
            {submitting ? 'Adding…' : 'Add task'}
            <span className="t-kbd t-kbd--on-accent">↵</span>
          </button>
        </div>
      </form>
    </div>
  )
}
