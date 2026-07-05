import { api } from '@convex/_generated/api'
import type { Doc, Id } from '@convex/_generated/dataModel'
import { useUser } from '@clerk/tanstack-react-start'
import { Calendar } from '@org/ui/components/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@org/ui/components/popover'
import { Slider } from '@org/ui/components/slider'
import { getRouteApi, Link, useNavigate } from '@tanstack/react-router'
import type { SpriteSheet } from '@worldkit/sprite-actor'
import { VillageCanvas } from '@worldkit/world-canvas'
import { useMutation, useQuery } from 'convex/react'
import {
  type FormEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import { customSheet, stubSheet } from '../agents/sprites'
import { GoalTypeSelectionIcon, goalTypeValue } from '../goals/goal-ui'
import { PRIORITY_LABELS, type TaskPriority } from '../tasks/priority'
import { BrandIcon } from './brand-icons'
import { EmojiGlyphButton } from './emoji-picker'
import {
  type DisplayTask,
  fmtCountdown,
  fmtDateBadge,
  firstName,
  greetingFor,
  sortForToday,
  toDisplayTask,
} from './helpers'
import { Nav } from './nav'
import { buildOfficeScene, OFFICE_CAPACITY, type OfficeAgent } from './office-scene'
import { todayStyles } from './styles'
import {
  ACCENT_OPTIONS,
  TWEAKS_STORAGE_KEY,
  type Tweaks,
  loadTweaks,
} from './tweaks'

const todayRoute = getRouteApi('/_authenticated/today')

function useLiveTime(intervalMs: number): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])
  return now
}

/** Sheets for every agent: stubs resolve immediately, uploads once measured. */
function useAgentSheets(
  agents: Doc<'agents'>[] | undefined,
): Map<string, SpriteSheet> {
  const [sheets, setSheets] = useState<Map<string, SpriteSheet>>(new Map())
  useEffect(() => {
    if (!agents || agents.length === 0) {
      setSheets(new Map())
      return
    }
    let alive = true
    const next = new Map<string, SpriteSheet>()
    const customs: { id: string; url: string }[] = []
    for (const agent of agents) {
      if (agent.sprite.kind === 'stub') {
        const sheet = stubSheet(agent.sprite.stubId)
        if (sheet) next.set(agent._id, sheet)
      } else {
        customs.push({ id: agent._id, url: agent.sprite.sheetUrl })
      }
    }
    setSheets(new Map(next))
    for (const { id, url } of customs) {
      const img = new Image()
      img.onload = () => {
        if (!alive) return
        const frameSize = Math.max(1, img.naturalHeight)
        const frames = Math.max(1, Math.round(img.naturalWidth / frameSize))
        next.set(id, customSheet(url, frameSize, frames))
        setSheets(new Map(next))
      }
      img.src = url
    }
    return () => {
      alive = false
    }
  }, [agents])
  return sheets
}

/** Pixel-perfect zoom: 2x on wide screens, 1x when the card would clip. */
function useOfficeZoom(): number {
  const [zoom, setZoom] = useState(2)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1240px)')
    const update = () => setZoom(mq.matches ? 1 : 2)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
  return zoom
}

function OfficeCard({ agents }: { agents: Doc<'agents'>[] | undefined }) {
  // The canvas drives itself with timers, so it only mounts on the client.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const zoom = useOfficeZoom()
  const sheets = useAgentSheets(agents)

  const scene = useMemo(() => {
    const officeAgents: OfficeAgent[] = []
    for (const agent of agents ?? []) {
      const sheet = sheets.get(agent._id)
      if (!sheet) continue
      officeAgents.push({
        id: agent._id,
        name: agent.name,
        sheet,
        personality: agent.personality,
      })
    }
    return buildOfficeScene(officeAgents)
  }, [agents, sheets])

  const total = agents?.length ?? 0
  const shown = Math.min(total, OFFICE_CAPACITY)

  return (
    <section className="t-office" aria-label="The office">
      <div className="t-office__head">
        <h2>The office</h2>
        {total > 0 && (
          <span className="t-office__count">
            {total > OFFICE_CAPACITY ? `${shown} of ${total} agents` : null}
          </span>
        )}
        <Link to="/agents" className="t-office__link">
          Manage agents
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </Link>
      </div>
      <div className="t-office__stage">
        {mounted ? (
          <VillageCanvas scene={scene} zoom={zoom} />
        ) : (
          <div className="t-office__placeholder" />
        )}
        {agents !== undefined && agents.length === 0 && (
          <div className="t-office__overlay">
            <p>Nobody works here yet.</p>
            <Link to="/agents">Create your first agent</Link>
          </div>
        )}
      </div>
    </section>
  )
}

function TaskRow({ task, now }: { task: DisplayTask; now: Date }) {
  const cd = task.deadline ? fmtCountdown(task.deadline, now.getTime()) : null
  return (
    <Link
      to="/tasks/$taskId"
      params={{ taskId: task.raw._id }}
      className="t-task-row"
    >
      {task.raw.emoji ? (
        <span className="t-task-row__emoji" aria-hidden>
          {task.raw.emoji}
        </span>
      ) : (
        <span
          className={
            't-task-row__dot' + (task.overdue ? ' t-task-row__dot--overdue' : '')
          }
        />
      )}
      <span className="t-task-row__title">{task.title}</span>
      {task.source && (
        <span className="t-task-row__src" title={task.source.label}>
          <BrandIcon kind={task.source.kind} size={14} />
        </span>
      )}
      {task.deadline && (
        <span
          className={
            't-task-row__due' + (task.overdue ? ' t-task-row__due--overdue' : '')
          }
        >
          {task.overdue && cd
            ? `${cd} late`
            : cd
              ? `${fmtDateBadge(task.deadline)} · in ${cd}`
              : fmtDateBadge(task.deadline)}
        </span>
      )}
    </Link>
  )
}

export type CaptureInput = {
  title: string
  estimateMinutes: number | null
  targetDate: string | null
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
  return m === 0 ? `${hh} ${ampm}` : `${hh}:${String(m).padStart(2, '0')} ${ampm}`
}

type GoalOption = {
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

type PanelCoords = { left: number; width: number; top?: number; bottom?: number }

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
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState<PanelCoords | null>(null)
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)

  // Anchor the (portaled) panel to the trigger with fixed positioning so it
  // escapes the scrolling details container and can overflow the footer.
  const place = useCallback(() => {
    const el = wrapRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const gap = 6
    const estPanel = 240
    const spaceBelow = window.innerHeight - r.bottom
    if (spaceBelow < estPanel && r.top > spaceBelow) {
      setCoords({
        left: r.left,
        width: r.width,
        bottom: window.innerHeight - r.top + gap,
      })
    } else {
      setCoords({ left: r.left, width: r.width, top: r.bottom + gap })
    }
  }, [])

  useLayoutEffect(() => {
    if (!open) return
    place()
    window.addEventListener('scroll', place, true)
    window.addEventListener('resize', place)
    return () => {
      window.removeEventListener('scroll', place, true)
      window.removeEventListener('resize', place)
    }
  }, [open, place])

  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      const t = e.target as Node
      if (wrapRef.current?.contains(t)) return
      if (panelRef.current?.contains(t)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const selected = goals?.find((g) => g._id === value) ?? null
  return (
    <div className="t-goalpick" ref={wrapRef}>
      <button
        type="button"
        className="t-goalpick__trigger"
        data-empty={selected ? undefined : true}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {selected && <GoalOptIcon goal={selected} />}
        <span className="t-goalpick__value">
          {selected ? selected.title : 'No goal'}
        </span>
        <svg
          className="t-goalpick__caret"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open &&
        coords &&
        createPortal(
          <div
            ref={panelRef}
            className="t-goalpick__panel"
            role="listbox"
            style={{
              position: 'fixed',
              left: coords.left,
              width: coords.width,
              ...(coords.top !== undefined
                ? { top: coords.top }
                : { bottom: coords.bottom }),
            }}
          >
            <button
              type="button"
              className="t-goalpick__opt"
              data-active={value === null ? true : undefined}
              onClick={() => {
                onSelect(null)
                setOpen(false)
              }}
            >
              <GoalOptIcon goal={null} />
              <span className="t-goalpick__opt-label">No goal</span>
            </button>
            {goals?.map((g) => (
              <button
                key={g._id}
                type="button"
                className="t-goalpick__opt"
                data-active={value === g._id ? true : undefined}
                onClick={() => {
                  onSelect(g._id)
                  setOpen(false)
                }}
              >
                <GoalOptIcon goal={g} />
                <span className="t-goalpick__opt-label">{g.title}</span>
              </button>
            ))}
            {goals && goals.length === 0 && (
              <div className="t-goalpick__empty">No active goals yet.</div>
            )}
          </div>,
          document.body,
        )}
    </div>
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

function CapturePalette({
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
  const [targetDate, setTargetDate] = useState('')
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
      setTargetDate('')
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
    return Number.isFinite(n) && n > 0 ? n : null
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
        setError('Estimate must be a positive number of minutes.')
        return
      }
      estimateMinutes = n
    }
    setError(null)
    setSubmitting(true)
    try {
      await onSubmit({
        title: trimmed,
        estimateMinutes,
        targetDate: targetDate || null,
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
    summaryChips.push({ key: 'estimate', label: `${estimateMinutesOrNull} min` })
  }
  if (priority !== null) {
    summaryChips.push({
      key: 'priority',
      label: `${PRIORITY_LABELS[priority]} priority`,
      dot: priority,
    })
  }
  if (difficulty !== null) {
    summaryChips.push({ key: 'difficulty', label: `Difficulty ${difficulty}/5` })
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
                  <span className="t-palette__label">Target date</span>
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
                      step={5}
                      inputMode="numeric"
                      disabled={submitting}
                      value={estimate}
                      onChange={(e) => {
                        const next = e.target.value
                        setEstimate(next)
                        // Without a valid estimate the slot length is unknown,
                        // so drop any chosen start time.
                        const n = Number(next.trim())
                        if (!(next.trim() !== '' && Number.isFinite(n) && n > 0)) {
                          setSlotStart(null)
                        }
                      }}
                      placeholder="—"
                    />
                    <span className="t-palette__suffix">min</span>
                  </div>
                </label>
              </div>
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
                  <div className="t-seg" role="radiogroup" aria-label="Priority">
                    {PRIORITY_CHOICES.map((choice) => (
                      <button
                        key={choice.label}
                        type="button"
                        role="radio"
                        aria-checked={priority === choice.value}
                        data-active={priority === choice.value ? true : undefined}
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

function TweaksPanel({
  tweaks,
  setTweaks,
  open,
  onOpenChange,
}: {
  tweaks: Tweaks
  setTweaks: (t: Tweaks) => void
  open: boolean
  onOpenChange: (next: boolean) => void
}) {
  if (!open) return null
  return (
    <div className="t-tweaks">
      <div className="t-tweaks__panel">
        <div className="t-tweaks__section">Appearance</div>
        <div className="t-tweaks__row">
          <span>Theme</span>
          <div className="t-tweaks__radio">
            {(['light', 'dark'] as const).map((opt) => (
              <button
                key={opt}
                type="button"
                data-active={tweaks.theme === opt}
                onClick={() => setTweaks({ ...tweaks, theme: opt })}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
        <div className="t-tweaks__row">
          <span>Accent</span>
          <div className="t-tweaks__swatches">
            {ACCENT_OPTIONS.map((c) => (
              <button
                key={c}
                className="t-tweaks__swatch"
                type="button"
                data-active={tweaks.accent === c}
                style={{ background: c }}
                onClick={() => setTweaks({ ...tweaks, accent: c })}
                aria-label={`Accent ${c}`}
              />
            ))}
          </div>
        </div>

        <div className="t-tweaks__section">Voice</div>
        <div className="t-tweaks__row">
          <span>Greeting</span>
          <div className="t-tweaks__radio">
            {(['casual', 'time-of-day'] as const).map((opt) => (
              <button
                key={opt}
                type="button"
                data-active={tweaks.greeting === opt}
                onClick={() => setTweaks({ ...tweaks, greeting: opt })}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            style={{
              border: 'none',
              background: 'transparent',
              color: 'var(--t-ink-3)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export function TodayDashboard() {
  const { user } = useUser()
  const userFullName =
    user?.fullName ??
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') ??
    user?.primaryEmailAddress?.emailAddress ??
    ''
  const userFirst = firstName(userFullName)

  const rawTasks = useQuery(api.tasks.list, {})
  const agents = useQuery(api.agents.list, {})
  const goals = useQuery(api.goals.list, {})
  const createTask = useMutation(api.tasks.create)

  const [tweaks, setTweaksState] = useState<Tweaks>(() => loadTweaks())
  const setTweaks = useCallback((next: Tweaks) => {
    setTweaksState(next)
    try {
      window.localStorage.setItem(TWEAKS_STORAGE_KEY, JSON.stringify(next))
    } catch {
      /* ignore */
    }
  }, [])

  // Sync dark theme to the global shadcn token system as well
  useEffect(() => {
    const root = document.documentElement
    if (tweaks.theme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
  }, [tweaks.theme])

  const live = useLiveTime(30_000)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [tweaksOpen, setTweaksOpen] = useState(false)

  // The N shortcut lives in the shared Nav; Escape closes the palette here.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setPaletteOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Arriving with ?capture=1 (the nav's "New task" from other pages) opens
  // the palette once, then cleans the URL.
  const { capture } = todayRoute.useSearch()
  const navigate = useNavigate()
  useEffect(() => {
    if (capture) {
      setPaletteOpen(true)
      void navigate({ to: '/today', search: {}, replace: true })
    }
  }, [capture, navigate])

  const display = useMemo<DisplayTask[]>(() => {
    if (!rawTasks) return []
    const openish = rawTasks.filter(
      (t) => t.status === 'open' || t.status === 'in_progress',
    )
    const mapped = openish.map((t) => toDisplayTask(t, live.getTime()))
    return sortForToday(mapped)
  }, [rawTasks, live])

  const overdueCount = useMemo(
    () => display.filter((t) => t.overdue).length,
    [display],
  )

  async function handleCapture(input: CaptureInput) {
    const softDeadline = input.targetDate
      ? new Date(`${input.targetDate}T23:59:00`).getTime()
      : null
    await createTask({
      title: input.title,
      estimateMinutes: input.estimateMinutes,
      softDeadline,
      scheduledStartMinutes: input.scheduledStartMinutes,
      priority: input.priority,
      difficulty: input.difficulty,
      emoji: input.emoji,
      goalId: input.goalId,
    })
  }

  const greet = greetingFor(live.getHours(), tweaks.greeting)
  const dateLabel = live.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div
      className="today-root"
      data-today-theme={tweaks.theme}
      style={{ ['--t-accent-raw' as never]: tweaks.accent }}
    >
      <style>{todayStyles}</style>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap"
      />

      <div className="t-main">
        <Nav
          active="today"
          onNewTask={() => setPaletteOpen(true)}
          onOpenSettings={() => setTweaksOpen(true)}
        />

        <section className="t-hello">
          <h1>
            {greet}, {userFirst}.
          </h1>
          <p className="t-hello__meta">
            <span>{dateLabel}</span>
            {rawTasks !== undefined && (
              <>
                <span className="t-dot-tiny" />
                <span>
                  {display.length === 0
                    ? 'Nothing scheduled today'
                    : `${display.length} task${display.length === 1 ? '' : 's'} today`}
                </span>
              </>
            )}
            {overdueCount > 0 && (
              <>
                <span className="t-dot-tiny" />
                <span className="t-hello__overdue">
                  {overdueCount} overdue
                </span>
              </>
            )}
          </p>
        </section>

        <OfficeCard agents={agents} />

        <section className="t-today">
          <div className="t-today__head">
            <h2>Today</h2>
            {display.length > 0 && (
              <span className="t-today__count">{display.length}</span>
            )}
          </div>
          {rawTasks === undefined ? null : display.length === 0 ? (
            <div className="t-today__empty">
              Nothing here. Press <span className="t-kbd">N</span> to add a
              task.
            </div>
          ) : (
            display.map((task) => (
              <TaskRow key={task.id} task={task} now={live} />
            ))
          )}
        </section>
      </div>

      <CapturePalette
        open={paletteOpen}
        goals={goals}
        onClose={() => setPaletteOpen(false)}
        onSubmit={handleCapture}
      />
      <TweaksPanel
        tweaks={tweaks}
        setTweaks={setTweaks}
        open={tweaksOpen}
        onOpenChange={setTweaksOpen}
      />
    </div>
  )
}
