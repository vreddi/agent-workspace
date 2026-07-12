import { api } from '@convex/_generated/api'
import { useMutation, useQuery } from 'convex/react'
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { partitionForDayView } from '@org/app-core'
import { useEffect, useMemo, useState } from 'react'
import { sortForToday, toDisplayTask, type DisplayTask } from '../today/helpers'
import { Nav } from '../today/nav'
import { todayStyles } from '../today/styles'
import { loadTweaks } from '../today/tweaks'
import { bucketize } from './buckets'
import { buildGraph, type DayNode } from './layout'
import { nodeTypes } from './nodes'
import { dayViewStyles } from './styles'

type Theme = 'light' | 'dark'

/** Resolve the effective theme from the saved preference (system → OS). */
function useResolvedTheme(): Theme {
  const currentUser = useQuery(api.users.current)
  const pref = (currentUser?.theme ?? 'system') as 'light' | 'dark' | 'system'
  const [systemDark, setSystemDark] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    setSystemDark(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  if (pref === 'dark') return 'dark'
  if (pref === 'light') return 'light'
  return systemDark ? 'dark' : 'light'
}

function useNow(intervalMs: number): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])
  return now
}

function startOfDayLabel(now: Date): { label: string; sub: string } {
  const hour = now.getHours()
  if (hour < 5)
    return { label: 'Late night', sub: "Tomorrow's day starts soon" }
  if (hour < 12)
    return { label: 'Start of day', sub: 'Sunrise → ' + dayName(now) }
  if (hour < 17) return { label: 'Day in motion', sub: 'Mid-' + dayName(now) }
  return { label: 'Day winding down', sub: 'Evening of ' + dayName(now) }
}

function dayName(d: Date): string {
  return d.toLocaleDateString('en-US', { weekday: 'long' })
}

function DayGraphInner({
  tasks,
  suggestions,
}: {
  tasks: DisplayTask[]
  suggestions: DisplayTask[]
}) {
  const now = useNow(60_000)
  const start = startOfDayLabel(now)
  const buckets = useMemo(
    () => bucketize(tasks, suggestions),
    [tasks, suggestions],
  )
  const { nodes, edges } = useMemo(
    () =>
      buildGraph({
        buckets,
        startLabel: start.label,
        endLabel: 'End of day',
        startSub: start.sub,
        endSub: 'Wrap up · review · rest',
      }),
    [buckets, start.label, start.sub],
  )

  const { fitView } = useReactFlow<DayNode>()
  useEffect(() => {
    // Defer one frame so layout sizing is committed before fitting.
    const id = window.requestAnimationFrame(() => {
      fitView({ padding: 0.18, duration: 600 })
    })
    return () => window.cancelAnimationFrame(id)
  }, [nodes.length, edges.length, fitView])

  return (
    <ReactFlow
      className="day-flow"
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable
      panOnDrag
      panOnScroll
      zoomOnPinch
      zoomOnScroll={false}
      minZoom={0.35}
      maxZoom={1.5}
      fitView
      fitViewOptions={{ padding: 0.18, duration: 0 }}
      proOptions={{ hideAttribution: true }}
    >
      <Background
        variant={BackgroundVariant.Dots}
        gap={28}
        size={1.2}
        color="rgba(20,22,28,0.10)"
      />
      <Controls position="bottom-right" showInteractive={false} />
      <MiniMap
        position="top-right"
        pannable
        zoomable
        maskColor="rgba(20,22,28,0.06)"
        nodeColor={(n) => {
          const data = (n as DayNode).data
          if (data.kind === 'anchor')
            return data.variant === 'start' ? '#f7c25c' : '#6b6fdc'
          if (data.kind === 'bucket') return '#2b6ef5'
          return data.task.overdue ? '#e25151' : '#16181d'
        }}
        nodeStrokeWidth={0}
      />
    </ReactFlow>
  )
}

export function DayGraph() {
  const rawTasks = useQuery(api.tasks.list, {})
  const [tweaks] = useState(() => loadTweaks())
  // Theme comes from the account preference (shared with Settings); useTheme()
  // at the root turns it into the `.dark` class that styles every surface.
  const theme = useResolvedTheme()
  const updateTheme = useMutation(api.users.updateTheme)
  const now = useNow(30_000)

  // Only what's actually on today's plate belongs on the chart: overdue,
  // due today, or undated tasks. Future-dated tasks that may finish early
  // come back as suggestions when their remaining cost fits the day.
  const { display, suggestions } = useMemo(() => {
    if (!rawTasks) return { display: [], suggestions: [] }
    const openish = rawTasks.filter(
      (t) => t.status === 'open' || t.status === 'in_progress',
    )
    const all = sortForToday(
      openish.map((t) => toDisplayTask(t, now.getTime())),
    )
    const { today, suggested } = partitionForDayView(all, now)
    return { display: today, suggestions: suggested }
  }, [rawTasks, now])

  const overdueCount = display.filter((t) => t.overdue).length
  const inProgress = display.filter(
    (t) => t.raw.status === 'in_progress',
  ).length

  return (
    <div
      className="today-root day-shell"
      data-today-theme={theme}
      style={{ ['--t-accent-raw' as never]: tweaks.accent }}
    >
      <style>{todayStyles}</style>
      <style>{dayViewStyles}</style>
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

      <div className="day-shell__nav">
        <Nav active="day" />
      </div>

      <div className="day-root" data-theme={theme}>
        <div className="d-topbar">
          <div className="d-title">
            <div className="d-title__main">Day view</div>
            <div className="d-title__sub">
              {now.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
              })}
            </div>
          </div>
          <div className="d-spacer" />
          <div className="d-stat">
            <b>{display.length}</b> task{display.length === 1 ? '' : 's'}
          </div>
          {inProgress > 0 && (
            <div className="d-stat">
              <b>{inProgress}</b> in progress
            </div>
          )}
          {suggestions.length > 0 && (
            <div className="d-stat">
              <b>{suggestions.length}</b> suggested
            </div>
          )}
          {overdueCount > 0 && (
            <div className="d-stat d-stat--alert">
              <b>{overdueCount}</b> overdue
            </div>
          )}
          <button
            type="button"
            className="d-back"
            onClick={() =>
              updateTheme({ theme: theme === 'dark' ? 'light' : 'dark' })
            }
            aria-label="Toggle theme"
            style={{ paddingRight: 14 }}
          >
            {theme === 'dark' ? '☀ Light' : '☾ Dark'}
          </button>
        </div>

        {rawTasks === undefined ? (
          <div className="d-empty">
            <div className="d-empty__title">Loading your day…</div>
            <div className="d-empty__body">Pulling tasks from the server.</div>
          </div>
        ) : display.length === 0 && suggestions.length === 0 ? (
          <div className="d-empty">
            <div className="d-empty__title">Your day is clear</div>
            <div className="d-empty__body">
              Nothing on the board for today. Capture a thought from the Today
              view and it will appear here in its time slot.
            </div>
          </div>
        ) : (
          <ReactFlowProvider>
            <DayGraphInner tasks={display} suggestions={suggestions} />
          </ReactFlowProvider>
        )}

        <div className="d-legend">
          <div className="d-legend__title">Legend</div>
          <div className="d-legend__row">
            <span className="d-legend__chip d-legend__chip--default" /> Time
            bucket
          </div>
          <div className="d-legend__row">
            <span className="d-legend__chip d-legend__chip--active" /> In
            progress
          </div>
          <div className="d-legend__row">
            <span className="d-legend__chip d-legend__chip--overdue" /> Overdue
          </div>
          <div className="d-legend__row">
            <span className="d-legend__chip d-legend__chip--suggested" />{' '}
            Suggested early start
          </div>
        </div>
      </div>
    </div>
  )
}
