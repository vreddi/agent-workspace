import { api } from '@convex/_generated/api'
import type { Doc } from '@convex/_generated/dataModel'
import { useClerk, useUser } from '@clerk/tanstack-react-start'
import { Link } from '@tanstack/react-router'
import {
  Avatar as UIAvatar,
  AvatarFallback as UIAvatarFallback,
  AvatarImage as UIAvatarImage,
} from '@org/ui/components/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@org/ui/components/dropdown-menu'
import type { SpriteSheet } from '@worldkit/sprite-actor'
import { VillageCanvas } from '@worldkit/world-canvas'
import { useMutation, useQuery } from 'convex/react'
import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { customSheet, stubSheet } from '../agents/sprites'
import { BrandIcon } from './brand-icons'
import {
  type DisplayTask,
  fmtCountdown,
  fmtDateBadge,
  firstName,
  greetingFor,
  initialsFromName,
  sortForToday,
  toDisplayTask,
} from './helpers'
import { buildOfficeScene, OFFICE_CAPACITY, type OfficeAgent } from './office-scene'
import { todayStyles } from './styles'
import {
  ACCENT_OPTIONS,
  TWEAKS_STORAGE_KEY,
  type Tweaks,
  loadTweaks,
} from './tweaks'

function useLiveTime(intervalMs: number): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])
  return now
}

function UserMenu({ onOpenSettings }: { onOpenSettings: () => void }) {
  const { user } = useUser()
  const { signOut } = useClerk()
  const fullName =
    user?.fullName ??
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') ??
    user?.primaryEmailAddress?.emailAddress ??
    'You'
  const email = user?.primaryEmailAddress?.emailAddress
  const initials = initialsFromName(fullName, 'Y')
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Open account menu"
          className="inline-flex shrink-0 cursor-pointer items-center justify-center rounded-[10px] border-0 bg-transparent p-0 outline-none transition-transform focus-visible:ring-2 focus-visible:ring-ring/50 active:translate-y-px"
        >
          <UIAvatar className="size-9 rounded-[10px] after:rounded-[10px]">
            <UIAvatarImage
              src={user?.imageUrl}
              alt={fullName}
              className="rounded-[10px]"
            />
            <UIAvatarFallback className="rounded-[10px] bg-gradient-to-br from-[#18a86b] to-[#0e7a4d] text-sm font-extrabold tracking-tight text-white">
              {initials}
            </UIAvatarFallback>
          </UIAvatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="truncate text-sm font-semibold text-foreground">
            {fullName}
          </span>
          {email && (
            <span className="truncate text-xs font-normal text-muted-foreground">
              {email}
            </span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(event) => {
            event.preventDefault()
            onOpenSettings()
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.36.39.58.91.6 1.51H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onSelect={() => {
            void signOut({ redirectUrl: '/' })
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function Nav({
  onCreate,
  onOpenSettings,
}: {
  onCreate: () => void
  onOpenSettings: () => void
}) {
  return (
    <header className="t-nav">
      <div className="t-nav__brand" aria-hidden="true">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 11l8-7 8 7" />
          <path d="M6 9.5V20h12V9.5" />
          <path d="M10 20v-6h4v6" />
        </svg>
      </div>
      <nav className="t-nav__links" aria-label="Main">
        <Link to="/today" className="t-nav__link" data-active="true">
          Today
        </Link>
        <Link to="/day" className="t-nav__link">
          Day view
        </Link>
        <Link to="/groups" className="t-nav__link">
          Groups
        </Link>
        <Link to="/agents" className="t-nav__link">
          Agents
        </Link>
      </nav>
      <span style={{ flex: 1 }} />
      <button className="t-btn-create" onClick={onCreate} type="button">
        New task
        <span className="t-kbd t-kbd--on-accent">N</span>
      </button>
      <UserMenu onOpenSettings={onOpenSettings} />
    </header>
  )
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
      <span
        className={
          't-task-row__dot' + (task.overdue ? ' t-task-row__dot--overdue' : '')
        }
      />
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
}

function todayDateString(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function CapturePalette({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (input: CaptureInput) => Promise<void>
}) {
  const [val, setVal] = useState('')
  const [estimate, setEstimate] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  useEffect(() => {
    if (open) {
      setVal('')
      setEstimate('')
      setTargetDate('')
      setError(null)
      setSubmitting(false)
      window.requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])
  if (!open) return null
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
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task')
    } finally {
      setSubmitting(false)
    }
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
          <span className="t-palette__plus">+</span>
          <input
            ref={inputRef}
            className="t-palette__input"
            value={val}
            disabled={submitting}
            onChange={(e) => setVal(e.target.value)}
            placeholder="What needs doing?"
          />
          <span className="t-kbd">↵</span>
        </div>
        <div className="t-palette__meta">
          <label className="t-palette__field">
            <span className="t-palette__label">Estimate</span>
            <div className="t-palette__field-input">
              <input
                type="number"
                min={0}
                step={5}
                inputMode="numeric"
                disabled={submitting}
                value={estimate}
                onChange={(e) => setEstimate(e.target.value)}
                placeholder="—"
              />
              <span className="t-palette__suffix">min</span>
            </div>
          </label>
          <label className="t-palette__field">
            <span className="t-palette__label">Target date</span>
            <div className="t-palette__field-input">
              <input
                type="date"
                disabled={submitting}
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
              />
              {targetDate !== todayDateString() && (
                <button
                  type="button"
                  className="t-palette__chip"
                  onClick={() => setTargetDate(todayDateString())}
                  disabled={submitting}
                >
                  Today
                </button>
              )}
              {targetDate !== '' && (
                <button
                  type="button"
                  className="t-palette__chip t-palette__chip--ghost"
                  onClick={() => setTargetDate('')}
                  disabled={submitting}
                  aria-label="Clear target date"
                >
                  Clear
                </button>
              )}
            </div>
          </label>
        </div>
        {error && <div className="t-palette__error">{error}</div>}
        <div className="t-palette__hints">
          <span>Both fields are optional — a title is enough.</span>
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

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setPaletteOpen(false)
      if ((e.key === 'n' || e.key === 'N') && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const tag = ((e.target as HTMLElement | null)?.tagName ?? '').toLowerCase()
        const editable = (e.target as HTMLElement | null)?.isContentEditable
        if (tag === 'input' || tag === 'textarea' || editable) return
        e.preventDefault()
        setPaletteOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

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
      groupId: null,
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
          onCreate={() => setPaletteOpen(true)}
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
