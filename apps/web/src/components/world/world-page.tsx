import * as React from 'react'
import { Link } from '@tanstack/react-router'
import { VillageCanvas, useTimeOfDay } from '@worldkit/world-canvas'
import { makeCozyVillageScene } from '@worldkit/world-canvas/demo'
import type { TimeOfDay } from '@worldkit/tilemap'

/**
 * Full-bleed showcase of the agent village, lit to match the visitor's
 * local time of day. The canvas only mounts on the client (it drives
 * itself with canvas + timers, and the server doesn't know the viewer's
 * clock), so SSR ships a lightweight placeholder.
 */

const BACKDROP: Record<TimeOfDay, React.CSSProperties> = {
  night: {
    background:
      'radial-gradient(circle at 50% 20%, #3a3252 0%, #262038 55%, #181226 100%)',
  },
  day: {
    background:
      'radial-gradient(circle at 50% 20%, #8fa8bf 0%, #6d8aa4 55%, #567288 100%)',
  },
}

const FRAME_BORDER: Record<TimeOfDay, string> = {
  night: '#100b1c',
  day: '#22303c',
}

/** `?time=day|night` overrides the clock — handy for demos and review. */
function timeOverride(): TimeOfDay | null {
  if (typeof window === 'undefined') return null
  const value = new URLSearchParams(window.location.search).get('time')
  return value === 'day' || value === 'night' ? value : null
}

export function WorldPage() {
  const localTime = useTimeOfDay()
  const [override] = React.useState(timeOverride)
  const time = override ?? localTime

  const scene = time ? makeCozyVillageScene(time) : null
  // Until the client clock is known, dress the page for night — the
  // signature look — so the placeholder doesn't flash a mismatched theme.
  const theme = time ?? 'night'

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
        ...BACKDROP[theme],
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
          AGENT VILLAGE
        </h1>
        <p style={{ margin: '10px 0 0', fontSize: 13, opacity: 0.75 }}>
          Your agents, living their little lives. Click one to chat.
        </p>
      </header>
      <div
        style={{
          position: 'relative',
          border: `6px solid ${FRAME_BORDER[theme]}`,
          borderRadius: 12,
          boxShadow: '0 18px 50px rgba(0, 0, 0, 0.55)',
          lineHeight: 0,
        }}
      >
        {scene ? (
          <VillageCanvas scene={scene} zoom={2} />
        ) : (
          <div
            style={{
              width: makeCozyVillageScene('night').map.width * 32 * 2,
              maxWidth: '90vw',
              height: makeCozyVillageScene('night').map.height * 32 * 2,
              background: '#4e5c41',
            }}
          />
        )}
        {theme === 'night' ? (
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
