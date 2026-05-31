import { api } from '@convex/_generated/api'
import type { Doc, Id } from '@convex/_generated/dataModel'
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
import { useMutation, useQuery } from 'convex/react'
import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { BrandIcon } from './brand-icons'
import { todayStyles } from './styles'
import {
  type DisplayAssignee,
  type DisplayTask,
  type FilterId,
  type Tone,
  TONE_STYLES,
  applyFilter,
  fmtCountdown,
  fmtDateBadge,
  firstName,
  greetingFor,
  initialsFromName,
  sortForToday,
  toDisplayTask,
} from './helpers'

type Theme = 'light' | 'dark'
type Greeting = 'casual' | 'time-of-day'

type Tweaks = {
  theme: Theme
  accent: string
  greeting: Greeting
  showAI: boolean
}

const ACCENT_OPTIONS = ['#2b6ef5', '#7b5cf6', '#16a34a', '#e25151', '#0a0a0a']
const TWEAKS_STORAGE_KEY = 'today.tweaks.v1'

// Token → hex. Stored as token strings so we can re-theme later without migrating data.
const GROUP_COLOR_TOKENS = [
  'indigo',
  'violet',
  'emerald',
  'amber',
  'rose',
  'slate',
] as const
type GroupColorToken = (typeof GROUP_COLOR_TOKENS)[number]
const GROUP_COLOR_HEX: Record<GroupColorToken, string> = {
  indigo: '#5b6cf5',
  violet: '#8b5cf6',
  emerald: '#10b981',
  amber: '#f59e0b',
  rose: '#f43f5e',
  slate: '#64748b',
}
function colorForGroup(color: string | undefined): string {
  if (!color) return GROUP_COLOR_HEX.indigo
  if ((GROUP_COLOR_TOKENS as readonly string[]).includes(color)) {
    return GROUP_COLOR_HEX[color as GroupColorToken]
  }
  // hex literal fall-through
  return color
}

// "all" = every task (no group filter); "inbox" = ungrouped (groupId === null); Id = that group
type GroupFilter = 'all' | 'inbox' | Id<'taskGroups'>

function loadTweaks(): Tweaks {
  if (typeof window === 'undefined')
    return { theme: 'light', accent: ACCENT_OPTIONS[0]!, greeting: 'time-of-day', showAI: true }
  try {
    const raw = window.localStorage.getItem(TWEAKS_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Tweaks>
      return {
        theme: parsed.theme === 'dark' ? 'dark' : 'light',
        accent: typeof parsed.accent === 'string' ? parsed.accent : ACCENT_OPTIONS[0]!,
        greeting: parsed.greeting === 'casual' ? 'casual' : 'time-of-day',
        showAI: parsed.showAI !== false,
      }
    }
  } catch {
    /* ignore */
  }
  return { theme: 'light', accent: ACCENT_OPTIONS[0]!, greeting: 'time-of-day', showAI: true }
}

function useLiveTime(intervalMs: number): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])
  return now
}

function Avatar({
  tone,
  initials,
  imageUrl,
  name,
  small,
}: {
  tone: Tone
  initials: string
  imageUrl?: string | null
  name?: string
  small?: boolean
}) {
  const style = TONE_STYLES[tone]
  const className = 't-avatar' + (small ? ' t-avatar--sm' : '')
  if (imageUrl) {
    return (
      <img
        className={className}
        src={imageUrl}
        alt={name ?? initials}
        title={name}
      />
    )
  }
  return (
    <div
      className={className}
      style={{ background: style.bg, color: style.fg }}
      title={name}
    >
      {initials}
    </div>
  )
}

function AvatarStack({
  assignees,
  max = 3,
}: {
  assignees: DisplayAssignee[]
  max?: number
}) {
  const shown = assignees.slice(0, max)
  const extra = assignees.length - shown.length
  return (
    <div className="t-avatar-stack">
      {shown.map((a) => (
        <Avatar
          key={a.userId}
          tone={a.tone}
          initials={a.initials}
          imageUrl={a.imageUrl}
          name={a.name}
          small
        />
      ))}
      {extra > 0 && <span className="t-count">{extra}+</span>}
    </div>
  )
}

function LiveClock() {
  const now = useLiveTime(1000)
  const hh = now.getHours()
  const mm = String(now.getMinutes()).padStart(2, '0')
  const ss = String(now.getSeconds()).padStart(2, '0')
  const ampm = hh >= 12 ? 'PM' : 'AM'
  const h12 = hh % 12 || 12
  return (
    <span className="t-clock">
      {h12}:{mm}
      <span style={{ color: 'var(--t-ink-3)' }}>:{ss}</span> {ampm}
    </span>
  )
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
          className="inline-flex shrink-0 cursor-pointer items-center justify-center rounded-[11px] border-0 bg-transparent p-0 outline-none transition-transform focus-visible:ring-2 focus-visible:ring-ring/50 active:translate-y-px"
        >
          <UIAvatar className="size-10 rounded-[11px] after:rounded-[11px]">
            <UIAvatarImage
              src={user?.imageUrl}
              alt={fullName}
              className="rounded-[11px]"
            />
            <UIAvatarFallback className="rounded-[11px] bg-gradient-to-br from-[#18a86b] to-[#0e7a4d] text-[15px] font-extrabold tracking-tight text-white shadow-[inset_0_-2px_0_rgba(0,0,0,0.12)]">
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

function Topbar({
  onCreate,
  onOpenSettings,
  brandLetter,
}: {
  onCreate: () => void
  onOpenSettings: () => void
  brandLetter: string
}) {
  const live = useLiveTime(60_000)
  const day = live.toLocaleDateString('en-US', { weekday: 'long' })
  const date = live.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return (
    <div className="t-topbar">
      <div className="t-brand">
        <div className="t-brand__mark">{brandLetter}</div>
      </div>
      <h1>Today</h1>
      <div className="t-topbar__meta">
        <span>
          {day}, {date}
        </span>
        <span className="t-dot-tiny" />
        <LiveClock />
      </div>
      <span style={{ flex: 1 }} />
      <Link
        to="/day"
        className="t-icon-btn"
        title="Day view (graph)"
        aria-label="Day view"
        style={{ width: 'auto', padding: '0 12px', gap: 8, fontSize: 12, fontWeight: 600 }}
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
        >
          <circle cx="12" cy="5" r="2" />
          <circle cx="6" cy="12" r="2" />
          <circle cx="18" cy="12" r="2" />
          <circle cx="9" cy="19" r="2" />
          <circle cx="15" cy="19" r="2" />
          <path d="M12 7v3M6 14v3M18 14v3M10.5 6.5L7.5 10.5M13.5 6.5l3 4M7.5 14l1.5 3.5M16.5 14l-1.5 3.5" />
        </svg>
        Day view
      </Link>
      <Link
        to="/groups"
        className="t-icon-btn"
        title="Groups"
        aria-label="Groups"
        style={{ paddingInline: 10, gap: 6, fontSize: 12, fontWeight: 600 }}
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
        >
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
        Groups
      </Link>
      <button className="t-btn-create" onClick={onCreate} type="button">
        <span style={{ fontSize: 18, lineHeight: 1, marginTop: -2 }}>＋</span>
        Create Task
        <span className="t-kbd t-kbd--on-accent">N</span>
      </button>
      <button className="t-icon-btn" type="button" title="Inbox" aria-label="Inbox">
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
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <span className="t-icon-btn__dot" />
      </button>
      <button
        className="t-icon-btn"
        type="button"
        title="Notifications"
        aria-label="Notifications"
      >
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
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        <span className="t-icon-btn__dot" />
      </button>
      <UserMenu onOpenSettings={onOpenSettings} />
    </div>
  )
}

function AIBrief({ tasks }: { tasks: DisplayTask[] }) {
  const text = useMemo(() => {
    const overdue = tasks.filter((t) => t.overdue).length
    if (tasks.length === 0)
      return `Nothing on the board — press N to capture a thought and I'll shape it.`
    if (overdue)
      return `Reschedule the ${overdue} overdue first — they're blocking the rest. Then start a 45-min focus block.`
    const first = tasks[0]
    return `${first!.title} is your highest-leverage block. Start there.`
  }, [tasks])
  const [shown, setShown] = useState('')
  useEffect(() => {
    let i = 0
    setShown('')
    const id = window.setInterval(() => {
      i += 2
      if (i >= text.length) {
        setShown(text)
        window.clearInterval(id)
      } else {
        setShown(text.slice(0, i))
      }
    }, 16)
    return () => window.clearInterval(id)
  }, [text])
  return (
    <div className="t-ai-pill">
      <span className="t-ai-pill__star">✦</span>
      <span>
        {shown}
        <span className="t-caret" />
      </span>
    </div>
  )
}

function UpNext({ task, now }: { task: DisplayTask; now: Date }) {
  const cd = fmtCountdown(task.deadline, now.getTime())
  const primary = task.assignees[0]
  return (
    <div className="t-upnext">
      <div className="t-upnext__eyebrow">
        <span className="t-dot" />
        Up next · {fmtDateBadge(task.deadline)}
      </div>
      <h3 className="t-upnext__title">{task.title}</h3>
      <div className="t-upnext__countdown">
        <b>{cd ?? '—'}</b>
        <small>until due</small>
      </div>
      <div className="t-upnext__assignee">
        {primary && (
          <>
            <Avatar
              tone={primary.tone}
              initials={primary.initials}
              imageUrl={primary.imageUrl}
              name={primary.name}
              small
            />
            <span className="t-upnext__assignee-name">{primary.name}</span>
          </>
        )}
        <span style={{ flex: 1 }} />
        {task.source && (
          <div className="t-source-chip">
            <BrandIcon kind={task.source.kind} size={14} />
            {task.source.label}
          </div>
        )}
      </div>
      <div className="t-upnext__row">
        <button className="t-upnext__btn-primary" type="button">
          Start focus block
          <span className="t-kbd t-kbd--on-accent">F</span>
        </button>
        <button className="t-upnext__btn-secondary" type="button">
          Snooze 30m
        </button>
      </div>
    </div>
  )
}

function Hero({
  tasks,
  now,
  tweaks,
  userFirstName,
}: {
  tasks: DisplayTask[]
  now: Date
  tweaks: Tweaks
  userFirstName: string
}) {
  const greet = greetingFor(now.getHours(), tweaks.greeting)
  const overdueCount = tasks.filter((t) => t.overdue).length
  const hero = useMemo(
    () =>
      tasks
        .filter((t) => !t.overdue && t.deadline)
        .sort((a, b) => a.deadline!.getTime() - b.deadline!.getTime())[0] ?? null,
    [tasks],
  )

  return (
    <section className="t-hero">
      <div className="t-hero__main">
        <h2 className="t-greeting">
          {greet}, {userFirstName} <span className="t-wave">👋</span>
        </h2>
        <div className="t-subgreeting">
          You have{' '}
          <b style={{ color: 'var(--t-ink-1)', fontWeight: 700 }}>
            {tasks.length} task{tasks.length === 1 ? '' : 's'}
          </b>{' '}
          today
          {overdueCount > 0 && (
            <>
              {' '}
              ·{' '}
              <b style={{ color: 'var(--t-overdue)', fontWeight: 700 }}>
                {overdueCount} overdue
              </b>
            </>
          )}
          .
          {tasks.length > 0
            ? " Most of them are quick — block 90 minutes after standup and you'll clear the urgent ones."
            : ' Take a breath, then capture what comes to mind.'}
        </div>
        {tweaks.showAI && <AIBrief tasks={tasks} />}
      </div>
      {hero && <UpNext task={hero} now={now} />}
    </section>
  )
}

function TaskCard({
  task,
  now,
  showAI,
}: {
  task: DisplayTask
  now: Date
  showAI: boolean
}) {
  const cd = task.deadline ? fmtCountdown(task.deadline, now.getTime()) : null
  return (
    <Link
      to="/tasks/$taskId"
      params={{ taskId: task.raw._id }}
      className={
        't-card' +
        (task.fresh ? ' t-card--fresh' : '') +
        (task.overdue ? ' t-card--overdue' : '')
      }
    >
      <header className="t-card__hdr">
        <h3 className="t-card__title">{task.title}</h3>
        {task.deadline && (
          <div className={'t-card__date' + (task.overdue ? ' t-card__date--overdue' : '')}>
            {fmtDateBadge(task.deadline)}
            {cd && <span className="t-dot" />}
            {cd && (
              <span
                className={
                  't-card__countdown' +
                  (task.overdue ? ' t-card__countdown--overdue' : '')
                }
              >
                {task.overdue ? `${cd} late` : `in ${cd}`}
              </span>
            )}
          </div>
        )}
      </header>

      {task.body ? (
        <p className="t-card__body">{task.body}</p>
      ) : task.fresh ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="t-shimmer-bar" style={{ width: '92%' }} />
          <div className="t-shimmer-bar" style={{ width: '78%' }} />
          <div className="t-shimmer-bar" style={{ width: '55%' }} />
        </div>
      ) : null}

      {showAI && task.aiSuggestion && (
        <div className="t-ai-badge">
          <span className="t-ai-badge__star" />
          {task.aiSuggestion}
        </div>
      )}

      <div className="t-card__divider" />

      <div className="t-card__footer">
        {task.source ? (
          <div className="t-source-chip">
            <BrandIcon kind={task.source.kind} size={14} />
            {task.source.label}
          </div>
        ) : (
          <div className="t-ai-badge">
            <span className="t-ai-badge__star" />
            Capturing…
          </div>
        )}
        <AvatarStack assignees={task.assignees} max={3} />
      </div>
    </Link>
  )
}

function FilterChips({
  counts,
  value,
  onChange,
}: {
  counts: Record<FilterId, number>
  value: FilterId
  onChange: (id: FilterId) => void
}) {
  const items: { id: FilterId; label: string; overdue?: boolean }[] = [
    { id: 'all', label: 'All' },
    { id: 'overdue', label: 'Overdue', overdue: true },
    { id: 'soon', label: 'Due soon' },
    { id: 'later', label: 'Later' },
  ]
  return (
    <div className="t-filter-chips">
      {items.map((it) => (
        <button
          key={it.id}
          type="button"
          className={'t-filter-chip' + (value === it.id ? ' t-filter-chip--active' : '')}
          onClick={() => onChange(it.id)}
        >
          {it.label}
          <span
            className={
              't-filter-chip__badge' +
              (it.overdue && counts[it.id] > 0
                ? ' t-filter-chip__badge--overdue'
                : '')
            }
          >
            {counts[it.id]}
          </span>
        </button>
      ))}
    </div>
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

function GroupRail({
  groups,
  active,
  onChange,
  onNew,
}: {
  groups: Doc<'taskGroups'>[]
  active: GroupFilter
  onChange: (next: GroupFilter) => void
  onNew: () => void
}) {
  return (
    <div className="t-group-rail">
      <button
        type="button"
        className={'t-group-pill' + (active === 'all' ? ' t-group-pill--active' : '')}
        onClick={() => onChange('all')}
      >
        <span className="t-group-pill__icon">✦</span>
        All
      </button>
      <button
        type="button"
        className={'t-group-pill' + (active === 'inbox' ? ' t-group-pill--active' : '')}
        onClick={() => onChange('inbox')}
      >
        <span className="t-group-pill__icon">📥</span>
        Inbox
      </button>
      {groups.map((g) => (
        <button
          key={g._id}
          type="button"
          className={'t-group-pill' + (active === g._id ? ' t-group-pill--active' : '')}
          onClick={() => onChange(g._id)}
        >
          {g.icon ? (
            <span className="t-group-pill__icon">{g.icon}</span>
          ) : (
            <span
              className="t-group-pill__dot"
              style={{ background: colorForGroup(g.color) }}
            />
          )}
          {g.name}
        </button>
      ))}
      <button
        type="button"
        className="t-group-pill t-group-pill--ghost"
        onClick={onNew}
        aria-label="New group"
      >
        <span className="t-group-pill__icon">＋</span>
        New group
      </button>
    </div>
  )
}

function NewGroupModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean
  onClose: () => void
  onCreate: (input: { name: string; color: GroupColorToken; icon: string | null }) => Promise<void>
}) {
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('')
  const [color, setColor] = useState<GroupColorToken>('indigo')
  const [submitting, setSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)
  useEffect(() => {
    if (open) {
      setName('')
      setIcon('')
      setColor('indigo')
      setSubmitting(false)
      window.requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])
  if (!open) return null
  async function handleSubmit(e?: FormEvent) {
    e?.preventDefault()
    const trimmed = name.trim()
    if (!trimmed || submitting) return
    setSubmitting(true)
    try {
      await onCreate({ name: trimmed, color, icon: icon.trim() || null })
      onClose()
    } finally {
      setSubmitting(false)
    }
  }
  return (
    <div
      className="t-newgroup-bd"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose()
      }}
    >
      <form
        className="t-newgroup"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <div className="t-newgroup__title">New group</div>
        <input
          ref={inputRef}
          className="t-newgroup__input"
          value={name}
          disabled={submitting}
          onChange={(e) => setName(e.target.value)}
          placeholder="Group name (e.g. Personal, Launch, Bug bash)"
        />
        <div className="t-newgroup__row">
          <input
            className="t-newgroup__input"
            style={{ width: 64, textAlign: 'center', flex: '0 0 64px' }}
            value={icon}
            maxLength={2}
            disabled={submitting}
            onChange={(e) => setIcon(e.target.value)}
            placeholder="🚀"
            aria-label="Emoji icon"
          />
          <div className="t-newgroup__swatches" role="radiogroup" aria-label="Group color">
            {GROUP_COLOR_TOKENS.map((c) => (
              <button
                key={c}
                type="button"
                className="t-newgroup__swatch"
                data-active={color === c}
                style={{ background: GROUP_COLOR_HEX[c] }}
                onClick={() => setColor(c)}
                aria-label={`Color ${c}`}
              />
            ))}
          </div>
        </div>
        <div className="t-newgroup__actions">
          <button
            type="button"
            className="t-newgroup__btn"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="t-newgroup__btn t-newgroup__btn--primary"
            disabled={submitting || name.trim() === ''}
          >
            {submitting ? 'Creating…' : 'Create group'}
          </button>
        </div>
      </form>
    </div>
  )
}

function CapturePalette({
  open,
  onClose,
  onSubmit,
  groupLabel,
  groupColor,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (input: CaptureInput) => Promise<void>
  groupLabel: string
  groupColor: string
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
            placeholder="Capture a task — title first, details optional…"
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
          <span className="t-palette__group">
            <span
              className="t-palette__group__dot"
              style={{ background: groupColor }}
            />
            {groupLabel}
          </span>
          <span>
            <span className="t-kbd">/</span> commands
          </span>
          <span>
            <span className="t-kbd">@</span> assign
          </span>
          <span>
            <span className="t-kbd">!</span> priority
          </span>
          <span className="t-palette__ai">
            ✦ Estimate &amp; target date are optional — schedule when to start
          </span>
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
  const setOpen = onOpenChange
  if (!open) {
    return (
      <div className="t-tweaks">
        <button
          className="t-tweaks__toggle"
          type="button"
          aria-label="Open tweaks"
          onClick={() => setOpen(true)}
        >
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
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.36.39.58.91.6 1.51H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </div>
    )
  }
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

        <div className="t-tweaks__section">AI</div>
        <div className="t-tweaks__row">
          <span>Show suggestions</span>
          <button
            className="t-tweaks__toggle-pill"
            type="button"
            data-on={tweaks.showAI}
            onClick={() => setTweaks({ ...tweaks, showAI: !tweaks.showAI })}
            aria-label="Toggle AI suggestions"
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={() => setOpen(false)}
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
  const meInitials = initialsFromName(userFullName, 'Y')
  const meInitial = meInitials[0] ?? 'Y'

  const [activeGroup, setActiveGroup] = useState<GroupFilter>('all')
  const [newGroupOpen, setNewGroupOpen] = useState(false)

  // Inbox = groupId null. Specific group = its Id. All = omit field entirely.
  const taskQueryArgs =
    activeGroup === 'all'
      ? {}
      : activeGroup === 'inbox'
        ? { groupId: null as Id<'taskGroups'> | null }
        : { groupId: activeGroup }

  const rawTasks = useQuery(api.tasks.list, taskQueryArgs)
  const groupsRaw = useQuery(api.groups.list, {})
  const groups = useMemo(
    () => (groupsRaw ?? []).slice().sort((a, b) => a.position - b.position),
    [groupsRaw],
  )
  const createTask = useMutation(api.tasks.create)
  const createGroup = useMutation(api.groups.create)

  const activeGroupDoc = useMemo(() => {
    if (activeGroup === 'all' || activeGroup === 'inbox') return null
    return groups.find((g) => g._id === activeGroup) ?? null
  }, [activeGroup, groups])
  const captureGroupLabel =
    activeGroup === 'all'
      ? 'Inbox'
      : activeGroup === 'inbox'
        ? 'Inbox'
        : activeGroupDoc?.name ?? 'Inbox'
  const captureGroupColor =
    activeGroup === 'all' || activeGroup === 'inbox'
      ? 'var(--t-ink-4)'
      : colorForGroup(activeGroupDoc?.color)

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

  const [filter, setFilter] = useState<FilterId>('all')
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

  const counts = useMemo(
    () => ({
      all: display.length,
      overdue: applyFilter(display, 'overdue', live.getTime()).length,
      soon: applyFilter(display, 'soon', live.getTime()).length,
      later: applyFilter(display, 'later', live.getTime()).length,
    }),
    [display, live],
  )

  const visible = useMemo(
    () => applyFilter(display, filter, live.getTime()),
    [display, filter, live],
  )

  async function handleCapture(input: CaptureInput) {
    // "All" view captures into Inbox by default — explicit user intent comes from picking a group.
    const groupId =
      activeGroup === 'all' || activeGroup === 'inbox' ? null : activeGroup
    const softDeadline = input.targetDate
      ? new Date(`${input.targetDate}T23:59:00`).getTime()
      : null
    await createTask({
      title: input.title,
      estimateMinutes: input.estimateMinutes,
      softDeadline,
      groupId,
    })
  }

  async function handleCreateGroup(input: {
    name: string
    color: GroupColorToken
    icon: string | null
  }) {
    const id = await createGroup({
      name: input.name,
      color: input.color,
      icon: input.icon ?? undefined,
    })
    setActiveGroup(id as Id<'taskGroups'>)
  }

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
        <Topbar
          onCreate={() => setPaletteOpen(true)}
          onOpenSettings={() => setTweaksOpen(true)}
          brandLetter={meInitial}
        />
        <GroupRail
          groups={groups}
          active={activeGroup}
          onChange={setActiveGroup}
          onNew={() => setNewGroupOpen(true)}
        />
        <Hero
          tasks={display}
          now={live}
          tweaks={tweaks}
          userFirstName={userFirst === 'there' ? 'there' : userFirst}
        />

        <div className="t-tasks-section">
          <div className="t-tasks-head">
            <h2>Today's tasks</h2>
            <span className="t-count">
              {visible.length} of {display.length}
            </span>
            <FilterChips counts={counts} value={filter} onChange={setFilter} />
          </div>

          {rawTasks === undefined ? (
            <div style={{ color: 'var(--t-ink-3)', fontSize: 14, padding: '24px 4px' }}>
              Loading tasks…
            </div>
          ) : visible.length === 0 ? (
            <div
              style={{
                color: 'var(--t-ink-3)',
                fontSize: 14,
                padding: '32px 4px',
                lineHeight: 1.5,
              }}
            >
              {display.length === 0
                ? 'Nothing on the board. Press N to capture a task.'
                : 'No tasks match this filter.'}
            </div>
          ) : (
            <div className="t-grid">
              {visible.map((task) => (
                <TaskCard key={task.id} task={task} now={live} showAI={tweaks.showAI} />
              ))}
            </div>
          )}
        </div>
      </div>

      <CapturePalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onSubmit={handleCapture}
        groupLabel={captureGroupLabel}
        groupColor={captureGroupColor}
      />
      <NewGroupModal
        open={newGroupOpen}
        onClose={() => setNewGroupOpen(false)}
        onCreate={handleCreateGroup}
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
