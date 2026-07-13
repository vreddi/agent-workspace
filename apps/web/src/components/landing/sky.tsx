import { useEffect, useRef } from 'react'

/**
 * Hero sky illustration in the verdant / goal-coin art style: painterly
 * pastel clouds, a soft sun, drifting sparkles, floating goal coins, and a
 * meadow rim with two village houses at the bottom. Three parallax layers
 * follow the mouse and scroll gently; every ambient loop is slow (6s+) and
 * killed entirely under prefers-reduced-motion.
 */

const LAYERS: { mouse: number; scroll: number }[] = [
  { mouse: 8, scroll: 0.05 }, // far clouds
  { mouse: 18, scroll: 0.12 }, // near clouds
  { mouse: 30, scroll: 0.2 }, // coins
]

type CoinSpec = {
  src: string
  size: number
  left: string
  top: string
  dur: number
  delay: number
}

const COINS: CoinSpec[] = [
  {
    src: '/goal-types/finance.png',
    size: 68,
    left: '9%',
    top: '30%',
    dur: 7.5,
    delay: 0,
  },
  {
    src: '/goal-types/travel.png',
    size: 82,
    left: '85%',
    top: '26%',
    dur: 8.5,
    delay: 1.3,
  },
  {
    src: '/goal-types/learning.png',
    size: 48,
    left: '22%',
    top: '14%',
    dur: 6.5,
    delay: 2.1,
  },
  {
    src: '/goal-types/skill-mastery.png',
    size: 52,
    left: '72%',
    top: '11%',
    dur: 7,
    delay: 0.7,
  },
  {
    src: '/goal-types/adventure.png',
    size: 56,
    left: '15%',
    top: '58%',
    dur: 8,
    delay: 1.8,
  },
  {
    src: '/goal-types/health-wellness.png',
    size: 60,
    left: '82%',
    top: '56%',
    dur: 7.2,
    delay: 2.6,
  },
]

type SparkleSpec = { left: string; top: string; size: number; delay: number }

const SPARKLES: SparkleSpec[] = [
  { left: '30%', top: '36%', size: 16, delay: 0 },
  { left: '63%', top: '18%', size: 12, delay: 1.6 },
  { left: '90%', top: '42%', size: 14, delay: 2.4 },
  { left: '40%', top: '10%', size: 10, delay: 0.9 },
  { left: '6%', top: '48%', size: 12, delay: 3.1 },
  { left: '70%', top: '46%', size: 10, delay: 4 },
]

export function Sky() {
  const layerRefs = useRef<(HTMLDivElement | null)[]>([null, null, null])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let raf: number | null = null
    const target = { x: 0, y: 0, sy: window.scrollY }
    const current = { x: 0, y: 0, sy: window.scrollY }

    function loop() {
      raf = null
      const nx = current.x + (target.x - current.x) * 0.1
      const ny = current.y + (target.y - current.y) * 0.1
      const nsy = current.sy + (target.sy - current.sy) * 0.16
      const more =
        Math.abs(nx - target.x) > 0.001 ||
        Math.abs(ny - target.y) > 0.001 ||
        Math.abs(nsy - target.sy) > 0.1
      current.x = nx
      current.y = ny
      current.sy = nsy
      for (let i = 0; i < layerRefs.current.length; i++) {
        const el = layerRefs.current[i]
        if (!el) continue
        const cfg = LAYERS[i]!
        const tx = nx * cfg.mouse
        const ty = ny * cfg.mouse * 0.5 + nsy * cfg.scroll
        el.style.transform = `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0)`
      }
      if (more) raf = window.requestAnimationFrame(loop)
    }

    function kick() {
      if (raf === null) raf = window.requestAnimationFrame(loop)
    }
    function onMove(e: MouseEvent) {
      target.x = (e.clientX / window.innerWidth - 0.5) * 2
      target.y = (e.clientY / window.innerHeight - 0.5) * 2
      kick()
    }
    function onScroll() {
      target.sy = window.scrollY
      kick()
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('scroll', onScroll)
      if (raf !== null) window.cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div className="sky" aria-hidden="true">
      <SkyDefs />
      <div className="sky__sun" />

      {/* far clouds: small, high, slow */}
      <div
        className="sky__layer"
        ref={(el) => void (layerRefs.current[0] = el)}
      >
        <CloudSvg
          className="sky__cloud"
          style={{
            left: '4%',
            top: '16%',
            width: 150,
            ['--sway' as string]: '48s',
          }}
        />
        <CloudSvg
          className="sky__cloud"
          style={{
            left: '38%',
            top: '6%',
            width: 120,
            opacity: 0.85,
            ['--sway' as string]: '62s',
          }}
        />
        <CloudSvg
          className="sky__cloud"
          style={{
            left: '66%',
            top: '20%',
            width: 135,
            opacity: 0.9,
            ['--sway' as string]: '55s',
          }}
        />
        <CloudSvg
          className="sky__cloud"
          style={{
            left: '88%',
            top: '8%',
            width: 110,
            opacity: 0.8,
            ['--sway' as string]: '70s',
          }}
        />
      </div>

      {/* two drifters that cross the whole sky, very slowly */}
      <div className="sky__drifters">
        <CloudSvg
          className="sky__cloud sky__cloud--drift"
          style={{ top: '12%', width: 130, ['--cross' as string]: '170s' }}
        />
        <CloudSvg
          className="sky__cloud sky__cloud--drift"
          style={{
            top: '38%',
            width: 100,
            opacity: 0.75,
            ['--cross' as string]: '210s',
            animationDelay: '-80s',
          }}
        />
      </div>

      {/* near clouds: big, framing the headline */}
      <div
        className="sky__layer"
        ref={(el) => void (layerRefs.current[1] = el)}
      >
        <CloudSvg
          className="sky__cloud"
          style={{
            left: '-4%',
            top: '42%',
            width: 300,
            ['--sway' as string]: '40s',
          }}
        />
        <CloudSvg
          className="sky__cloud"
          style={{
            left: '76%',
            top: '38%',
            width: 340,
            ['--sway' as string]: '46s',
            animationDelay: '-18s',
          }}
        />
        <CloudSvg
          className="sky__cloud"
          style={{
            left: '30%',
            top: '66%',
            width: 220,
            opacity: 0.92,
            ['--sway' as string]: '52s',
            animationDelay: '-30s',
          }}
        />
      </div>

      <div className="sky__sparkles">
        {SPARKLES.map((s, i) => (
          <Sparkle key={i} {...s} />
        ))}
      </div>

      {/* floating goal coins */}
      <div
        className="sky__layer"
        ref={(el) => void (layerRefs.current[2] = el)}
      >
        {COINS.map((c) => (
          <img
            key={c.src}
            className="sky__coin"
            src={c.src}
            alt=""
            width={c.size}
            height={c.size}
            style={{
              left: c.left,
              top: c.top,
              width: c.size,
              ['--bob' as string]: `${c.dur}s`,
              animationDelay: `${c.delay}s`,
            }}
          />
        ))}
      </div>

      <Hills />
    </div>
  )
}

/* Shared gradients, referenced by url(#lp-*) from every SVG below. */
function SkyDefs() {
  return (
    <svg
      width="0"
      height="0"
      style={{ position: 'absolute' }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="lp-cloud-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fffefb" />
          <stop offset="100%" stopColor="#e8f2fb" />
        </linearGradient>
        <linearGradient id="lp-cloud-shade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#cadff3" />
          <stop offset="100%" stopColor="#b3cbe9" />
        </linearGradient>
        <linearGradient id="lp-cloud-under" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#bcd3ee" />
          <stop offset="100%" stopColor="#a9c2e4" />
        </linearGradient>
        <linearGradient id="lp-hill-back" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#cfe3a9" />
          <stop offset="100%" stopColor="#9cc37f" />
        </linearGradient>
        <linearGradient id="lp-hill-front" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a5cd84" />
          <stop offset="100%" stopColor="#6f9c55" />
        </linearGradient>
        <linearGradient id="lp-hill-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6f9c55" />
          <stop offset="100%" stopColor="#f3f4e4" />
        </linearGradient>
        <linearGradient id="lp-tree" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8fbf72" />
          <stop offset="100%" stopColor="#548a4a" />
        </linearGradient>
      </defs>
    </svg>
  )
}

function CloudSvg({
  className,
  style,
}: {
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <svg
      className={className}
      style={style}
      viewBox="0 0 220 112"
      aria-hidden="true"
    >
      <ellipse cx="110" cy="88" rx="90" ry="18" fill="url(#lp-cloud-shade)" />
      <circle cx="42" cy="74" r="24" fill="url(#lp-cloud-body)" />
      <circle cx="178" cy="76" r="22" fill="url(#lp-cloud-body)" />
      <circle cx="75" cy="56" r="32" fill="url(#lp-cloud-body)" />
      <circle cx="146" cy="58" r="30" fill="url(#lp-cloud-body)" />
      <circle cx="110" cy="44" r="38" fill="url(#lp-cloud-body)" />
      <rect
        x="28"
        y="60"
        width="164"
        height="34"
        rx="17"
        fill="url(#lp-cloud-body)"
      />
      <ellipse cx="96" cy="32" rx="30" ry="11" fill="#fffefb" opacity="0.9" />
      <ellipse
        cx="72"
        cy="88"
        rx="28"
        ry="8"
        fill="url(#lp-cloud-under)"
        opacity="0.5"
      />
      <ellipse
        cx="150"
        cy="90"
        rx="30"
        ry="8"
        fill="url(#lp-cloud-under)"
        opacity="0.45"
      />
    </svg>
  )
}

export function Sparkle({ left, top, size, delay }: SparkleSpec) {
  return (
    <svg
      className="sky__sparkle"
      style={{ left, top, width: size, animationDelay: `${delay}s` }}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        d="M12 0 C13 8 16 11 24 12 C16 13 13 16 12 24 C11 16 8 13 0 12 C8 11 11 8 12 0"
        fill="#fff7dd"
      />
    </svg>
  )
}

function Hills() {
  return (
    <svg
      className="sky__hills"
      viewBox="0 0 1440 260"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
    >
      {/* back meadow */}
      <path
        d="M0 260 L0 150 Q 240 92 480 130 Q 700 164 900 128 Q 1150 86 1440 138 L1440 260 Z"
        fill="url(#lp-hill-back)"
      />
      {/* trees on the back ridge */}
      <Tree x={210} y={112} s={1} />
      <Tree x={340} y={122} s={0.8} />
      <Tree x={1030} y={112} s={0.9} />
      <Tree x={1250} y={104} s={1.05} />
      {/* two village houses */}
      <House x={520} y={96} />
      <House x={880} y={92} flip />
      {/* front meadow */}
      <path
        d="M0 260 L0 200 Q 320 152 720 188 Q 1080 218 1440 180 L1440 260 Z"
        fill="url(#lp-hill-front)"
      />
      {/* fade into the paper of the next section */}
      <rect x="0" y="226" width="1440" height="34" fill="url(#lp-hill-fade)" />
    </svg>
  )
}

function Tree({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="-3" y="14" width="6" height="14" rx="2" fill="#7a5236" />
      <circle cx="0" cy="2" r="16" fill="url(#lp-tree)" />
      <circle cx="-11" cy="9" r="10" fill="url(#lp-tree)" />
      <circle cx="11" cy="9" r="10" fill="url(#lp-tree)" />
      <ellipse cx="-4" cy="-4" rx="7" ry="4" fill="#b8db96" opacity="0.8" />
    </g>
  )
}

function House({ x, y, flip }: { x: number; y: number; flip?: boolean }) {
  return (
    <g transform={`translate(${x} ${y})${flip ? ' scale(-1,1)' : ''}`}>
      {/* walls */}
      <rect x="-20" y="8" width="40" height="30" rx="3" fill="#fdf3e0" />
      {/* roof */}
      <path
        d="M-26 12 L0 -14 L26 12 Q 26 16 21 16 L-21 16 Q -26 16 -26 12 Z"
        fill="#d98a63"
      />
      <path d="M-26 12 L0 -14 L4 -10 L-20 14 Z" fill="#e8a67e" />
      {/* door + window */}
      <rect x="-13" y="20" width="11" height="18" rx="4" fill="#a4653f" />
      <rect x="4" y="20" width="11" height="10" rx="2.5" fill="#f7d98b" />
      <path d="M4 25 h11 M9.5 20 v10" stroke="#c99a52" strokeWidth="1.4" />
      {/* chimney */}
      <rect x="10" y="-10" width="7" height="12" rx="1.5" fill="#b06a4a" />
    </g>
  )
}
