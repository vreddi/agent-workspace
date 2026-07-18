import { api } from '@convex/_generated/api'
import type { Doc } from '@convex/_generated/dataModel'
import { useUser } from '@clerk/tanstack-react-start'
import { Link } from '@tanstack/react-router'
import type { SpriteSheet } from '@worldkit/sprite-actor'
import { VillageCanvas, useWorldClock } from '@worldkit/world-canvas'
import { useMutation, useQuery } from 'convex/react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { customSheet, stubSheet } from '../agents/sprites'
import { BrandIcon } from './brand-icons'
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
import {
  buildOfficeScene,
  OFFICE_CAPACITY,
  type OfficeAgent,
} from './office-scene'
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
  // A paused day/night clock graded to the viewer's local time: the scene is
  // lit like the Borough (ambient tint, cast shadows, lit windows at night)
  // but held at the current hour rather than animating on a work page.
  const clock = useWorldClock({ running: false })
  const { setHour } = clock
  useEffect(() => {
    const now = new Date()
    setHour(now.getHours() + now.getMinutes() / 60)
  }, [setHour])

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
    return buildOfficeScene(officeAgents, clock.artMood)
  }, [agents, sheets, clock.artMood])

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
          <VillageCanvas scene={scene} zoom={zoom} hour={clock.hour} />
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
            't-task-row__dot' +
            (task.overdue ? ' t-task-row__dot--overdue' : '')
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
            't-task-row__due' +
            (task.overdue ? ' t-task-row__due--overdue' : '')
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

function TweaksPanel({
  tweaks,
  setTweaks,
  themePref,
  onThemeChange,
  open,
  onOpenChange,
}: {
  tweaks: Tweaks
  setTweaks: (t: Tweaks) => void
  themePref: 'light' | 'dark' | 'system'
  onThemeChange: (t: 'light' | 'dark') => void
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
                data-active={themePref === opt}
                onClick={() => onThemeChange(opt)}
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

  const [tweaks, setTweaksState] = useState<Tweaks>(() => loadTweaks())
  const setTweaks = useCallback((next: Tweaks) => {
    setTweaksState(next)
    try {
      window.localStorage.setItem(TWEAKS_STORAGE_KEY, JSON.stringify(next))
    } catch {
      /* ignore */
    }
  }, [])

  // Theme lives on the account (shared with Settings) so it applies app-wide
  // and across devices; useTheme() at the root turns it into the `.dark` class.
  const currentUser = useQuery(api.users.current)
  const themePref = (currentUser?.theme ?? 'system') as
    'light' | 'dark' | 'system'
  const updateTheme = useMutation(api.users.updateTheme)

  const live = useLiveTime(30_000)
  const [tweaksOpen, setTweaksOpen] = useState(false)

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
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap"
      />

      <div className="t-main">
        <Nav active="today" onOpenSettings={() => setTweaksOpen(true)} />

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
                <span className="t-hello__overdue">{overdueCount} overdue</span>
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

      <TweaksPanel
        tweaks={tweaks}
        setTweaks={setTweaks}
        themePref={themePref}
        onThemeChange={(t) => updateTheme({ theme: t })}
        open={tweaksOpen}
        onOpenChange={setTweaksOpen}
      />
    </div>
  )
}
