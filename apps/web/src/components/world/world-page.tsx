import * as React from 'react'
import { Link } from '@tanstack/react-router'
import { VillageCanvas, useWorldClock } from '@worldkit/world-canvas'
import type { DayPhase } from '@worldkit/world-canvas'
import { makeBoroughScene } from '@worldkit/world-canvas/demo'

/**
 * Full-bleed showcase of the Borough — the agents' home world, where they
 * come back to relax between work hours — on a live day/night cycle. The
 * canvas only mounts on the client (it drives itself with canvas + timers, and
 * the server doesn't know the viewer's clock), so SSR ships a lightweight
 * placeholder and the page dresses for night — the signature look — until the
 * clock is known.
 *
 * URL params (all optional):
 *   ?hour=<0-24 float>   set the starting in-world hour (default: wall clock)
 *   ?speed=<h/real-sec>  game-hours advanced per real second (default 1/60)
 *   ?time=day|night      back-compat shortcut mapping to hour 12 / 22
 */

const BACKDROP: Record<DayPhase, React.CSSProperties> = {
  dawn: {
    background:
      'radial-gradient(circle at 50% 22%, #e7b48a 0%, #b98aa0 52%, #6d5f86 100%)',
  },
  day: {
    background:
      'radial-gradient(circle at 50% 20%, #a9c7d6 0%, #7ca6b4 55%, #5d8494 100%)',
  },
  dusk: {
    background:
      'radial-gradient(circle at 50% 24%, #f0a568 0%, #a65f79 50%, #4a3a63 100%)',
  },
  night: {
    background:
      'radial-gradient(circle at 50% 20%, #3a3252 0%, #262038 55%, #181226 100%)',
  },
}

const FRAME_BORDER: Record<DayPhase, string> = {
  dawn: '#4a3a52',
  day: '#22303c',
  dusk: '#3a2740',
  night: '#100b1c',
}

const PHASE_LABEL: Record<DayPhase, string> = {
  dawn: 'Dawn',
  day: 'Day',
  dusk: 'Dusk',
  night: 'Night',
}

/** Read the initial clock from the URL, falling back to the wall clock. */
function readInitialClock(): { hour: number; speed: number } {
  const fallback = { hour: 12, speed: 1 / 60 }
  if (typeof window === 'undefined') return fallback
  const params = new URLSearchParams(window.location.search)

  const hourParam = Number(params.get('hour'))
  const timeParam = params.get('time')
  let hour: number
  if (params.get('hour') != null && Number.isFinite(hourParam)) {
    hour = hourParam
  } else if (timeParam === 'day') {
    hour = 12
  } else if (timeParam === 'night') {
    hour = 22
  } else {
    const now = new Date()
    hour = now.getHours() + now.getMinutes() / 60
  }

  const speedParam = Number(params.get('speed'))
  const speed =
    params.get('speed') != null && Number.isFinite(speedParam) && speedParam > 0
      ? speedParam
      : 1 / 60

  return { hour, speed }
}

function formatClock(hour: number): string {
  const h = Math.floor(hour) % 24
  const m = Math.floor((hour - Math.floor(hour)) * 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function WorldPage() {
  const initial = React.useMemo(readInitialClock, [])
  const clock = useWorldClock({ hour: initial.hour, speed: initial.speed })

  // Only mount the live canvas after hydration so SSR markup (a night-dressed
  // placeholder) matches the first client render and the viewer's clock drives
  // the scene from there.
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  // Rebuild the scene only when the baked art mood flips (day <-> night); the
  // demo caches one scene per mood, so actor identities — and thus their
  // wandering state — carry across every in-between hour.
  const scene = React.useMemo(
    () => makeBoroughScene(clock.artMood),
    [clock.artMood],
  )

  const phase: DayPhase = mounted ? clock.phase : 'night'

  return (
    <div
      style={{
        minHeight: '100vh',
        minWidth: 'fit-content',
        display: 'grid',
        placeItems: 'center',
        alignContent: 'center',
        gap: 20,
        padding: 24,
        transition: 'background 1.5s ease',
        ...BACKDROP[phase],
        fontFamily: "'Courier New', ui-monospace, monospace",
      }}
    >
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap"
      />
      <header style={{ textAlign: 'center', color: '#f2e8cf' }}>
        <h1
          style={{
            margin: 0,
            fontFamily: "'Press Start 2P', 'Courier New', monospace",
            fontSize: 18,
            letterSpacing: 1,
            textShadow: '0 3px 0 rgba(0,0,0,0.4)',
          }}
        >
          THE BOROUGH
        </h1>
        <p style={{ margin: '10px 0 0', fontSize: 13, opacity: 0.75 }}>
          Where your agents come home to unwind. Click one to chat.
        </p>
      </header>
      <div
        style={{
          position: 'relative',
          border: `6px solid ${FRAME_BORDER[phase]}`,
          borderRadius: 12,
          boxShadow: '0 18px 50px rgba(0, 0, 0, 0.55)',
          lineHeight: 0,
        }}
      >
        {mounted ? (
          <VillageCanvas scene={scene} zoom={2} hour={clock.hour} />
        ) : (
          <div
            style={{
              width: scene.map.width * 32 * 2,
              maxWidth: '90vw',
              height: scene.map.height * 32 * 2,
              background: '#3a4a34',
            }}
          />
        )}
        {phase === 'night' || phase === 'dusk' ? (
          /* Dusk vignette: sits above the canvas layers but below the
             dialogue box (zIndex 2000) so text stays crisp. */
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 1500,
              pointerEvents: 'none',
              background:
                'radial-gradient(ellipse at 50% 42%, rgba(24, 18, 38, 0) 55%, rgba(24, 18, 38, 0.28) 100%)',
            }}
          />
        ) : null}
        {mounted ? (
          <div
            style={{
              position: 'absolute',
              right: 10,
              bottom: 10,
              zIndex: 1600,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '5px 10px',
              borderRadius: 999,
              background: 'rgba(16, 11, 28, 0.55)',
              color: '#f2e8cf',
              fontSize: 11,
              letterSpacing: 0.5,
              lineHeight: 1,
              pointerEvents: 'none',
              backdropFilter: 'blur(2px)',
            }}
          >
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>
              {formatClock(clock.hour)}
            </span>
            <span style={{ opacity: 0.7 }}>{PHASE_LABEL[phase]}</span>
          </div>
        ) : null}
      </div>
      <Link
        to="/"
        style={{ color: '#9cc7e8', fontSize: 13, letterSpacing: 0.5 }}
      >
        ← back home
      </Link>
    </div>
  )
}
