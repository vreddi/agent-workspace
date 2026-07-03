import * as React from 'react'
import { Link } from '@tanstack/react-router'
import { VillageCanvas } from '@worldkit/world-canvas'
import { cozyVillageScene } from '@worldkit/world-canvas/demo'

/**
 * Full-bleed showcase of the agent village. The canvas only mounts on the
 * client (it drives itself with canvas + timers), so SSR ships a lightweight
 * placeholder.
 */
export function WorldPage() {
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        alignContent: 'center',
        gap: 20,
        padding: 24,
        background:
          'radial-gradient(circle at 50% 20%, #2e4a63 0%, #1c2e40 55%, #14212f 100%)',
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
          border: '6px solid #0d1622',
          borderRadius: 12,
          boxShadow: '0 18px 50px rgba(0, 0, 0, 0.5)',
          lineHeight: 0,
        }}
      >
        {mounted ? (
          <VillageCanvas scene={cozyVillageScene} zoom={2} />
        ) : (
          <div
            style={{
              width: cozyVillageScene.map.width * 32 * 2,
              maxWidth: '90vw',
              height: cozyVillageScene.map.height * 32 * 2,
              background: '#8fc463',
            }}
          />
        )}
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
