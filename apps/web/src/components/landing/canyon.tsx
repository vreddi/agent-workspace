import { useEffect, useRef } from 'react'

/**
 * V-shaped canyon backdrop. Four parallax layers + drifting birds.
 * Back layers shift less, front layers shift more (correct depth cue).
 */
const LAYERS: { mouse: number; scroll: number; depth: number }[] = [
  { mouse: 8, scroll: 0.04, depth: 0 }, // sky tint / sun
  { mouse: 14, scroll: 0.08, depth: 1 }, // hazy back mountains
  { mouse: 22, scroll: 0.16, depth: 2 }, // peach mid cliffs
  { mouse: 36, scroll: 0.28, depth: 3 }, // orange front cliffs
  { mouse: 54, scroll: 0.42, depth: 4 }, // foreground grass
]

export function Canyon() {
  const layerRefs = useRef<(HTMLDivElement | null)[]>([null, null, null, null, null])
  const birdsRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    let raf: number | null = null
    const target = { x: 0, y: 0, sy: window.scrollY }
    const current = { x: 0, y: 0, sy: window.scrollY }

    function loop() {
      raf = null
      const nx = current.x + (target.x - current.x) * 0.12
      const ny = current.y + (target.y - current.y) * 0.12
      const nsy = current.sy + (target.sy - current.sy) * 0.18
      const more =
        Math.abs(nx - current.x) > 0.0002 ||
        Math.abs(ny - current.y) > 0.0002 ||
        Math.abs(nsy - current.sy) > 0.08
      current.x = nx
      current.y = ny
      current.sy = nsy
      for (let i = 0; i < layerRefs.current.length; i++) {
        const el = layerRefs.current[i]
        if (!el) continue
        const cfg = LAYERS[i]!
        const tx = nx * cfg.mouse
        const ty = ny * cfg.mouse * 0.45 - nsy * cfg.scroll
        el.style.transform = `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0)`
      }
      if (birdsRef.current) {
        const bx = nx * 18
        const by = ny * 10 - nsy * 0.22
        birdsRef.current.style.transform = `translate3d(${bx.toFixed(2)}px, ${by.toFixed(2)}px, 0)`
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
    <div className="canyon" aria-hidden="true">
      {/* sky wash + warm sun glow */}
      <div className="canyon__sky" ref={(el) => void (layerRefs.current[0] = el)}>
        <div className="canyon__sun" />
      </div>

      {/* back atmospheric mountains */}
      <div className="canyon__layer" ref={(el) => void (layerRefs.current[1] = el)}>
        <BackMountains />
      </div>

      {/* mid peach cliffs */}
      <div className="canyon__layer" ref={(el) => void (layerRefs.current[2] = el)}>
        <MidCliffs />
      </div>

      {/* drifting birds in the misty middle */}
      <div className="canyon__birds" ref={birdsRef}>
        <Bird x={49} y={32} scale={0.9} delay={0} />
        <Bird x={42} y={40} scale={0.6} delay={2.6} />
        <Bird x={56} y={36} scale={0.7} delay={5.2} />
      </div>

      {/* front orange cliffs */}
      <div className="canyon__layer" ref={(el) => void (layerRefs.current[3] = el)}>
        <FrontCliffs />
      </div>

      {/* foreground grass tufts */}
      <div className="canyon__layer canyon__layer--front" ref={(el) => void (layerRefs.current[4] = el)}>
        <ForegroundGrass />
      </div>

      {/* misty valley wash — overlays everything except foreground */}
      <div className="canyon__mist" />
    </div>
  )
}

/* ────────────────────────────────────────────────────────────── */

function BackMountains() {
  return (
    <svg
      viewBox="0 0 1920 900"
      preserveAspectRatio="xMidYMax slice"
      width="100%"
      height="100%"
    >
      <defs>
        <linearGradient id="back-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c9bce0" />
          <stop offset="60%" stopColor="#a999c8" />
          <stop offset="100%" stopColor="#8a78b0" />
        </linearGradient>
        <filter id="back-grain" x="0" y="0" width="100%" height="100%">
          <feTurbulence baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix
            values="0 0 0 0 0.55  0 0 0 0 0.48  0 0 0 0 0.68  0 0 0 0.18 0"
          />
          <feComposite in2="SourceGraphic" operator="in" />
        </filter>
      </defs>
      <path
        d="M0 900 L0 470
           C 90 430, 200 410, 320 440
           C 420 465, 500 510, 580 540
           C 670 575, 760 605, 840 615
           C 930 625, 1010 600, 1090 580
           C 1180 555, 1260 575, 1340 555
           C 1430 530, 1520 470, 1620 445
           C 1720 420, 1820 435, 1920 470
           L 1920 900 Z"
        fill="url(#back-grad)"
        opacity="0.78"
      />
      <path
        d="M0 900 L0 470
           C 90 430, 200 410, 320 440
           C 420 465, 500 510, 580 540
           C 670 575, 760 605, 840 615
           C 930 625, 1010 600, 1090 580
           C 1180 555, 1260 575, 1340 555
           C 1430 530, 1520 470, 1620 445
           C 1720 420, 1820 435, 1920 470
           L 1920 900 Z"
        filter="url(#back-grain)"
        opacity="0.55"
      />
    </svg>
  )
}

function MidCliffs() {
  return (
    <svg
      viewBox="0 0 1920 900"
      preserveAspectRatio="xMidYMax slice"
      width="100%"
      height="100%"
    >
      <defs>
        <linearGradient id="mid-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e9b497" />
          <stop offset="45%" stopColor="#c98669" />
          <stop offset="100%" stopColor="#90523f" />
        </linearGradient>
        <linearGradient id="mid-shade-left" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0%" stopColor="#5e2c20" stopOpacity="0.42" />
          <stop offset="55%" stopColor="#5e2c20" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="mid-shade-right" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#5e2c20" stopOpacity="0.42" />
          <stop offset="55%" stopColor="#5e2c20" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="foliage-mid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a4c694" />
          <stop offset="100%" stopColor="#5d8d5a" />
        </linearGradient>
        <filter id="mid-grain" x="0" y="0" width="100%" height="100%">
          <feTurbulence baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix
            values="0 0 0 0 0.32  0 0 0 0 0.18  0 0 0 0 0.10  0 0 0 0.22 0"
          />
          <feComposite in2="SourceGraphic" operator="in" />
        </filter>
      </defs>
      {/* main cliff silhouette */}
      <path
        d="M0 900 L0 240
           C 90 220, 200 245, 280 290
           C 360 335, 420 410, 470 500
           C 510 575, 545 645, 600 720
           C 660 790, 740 855, 830 870
           L 870 873
           Q 960 880, 1050 873
           L 1090 870
           C 1180 855, 1260 790, 1320 720
           C 1375 645, 1410 575, 1450 500
           C 1500 410, 1560 335, 1640 290
           C 1720 245, 1830 220, 1920 240
           L 1920 900 Z"
        fill="url(#mid-grad)"
      />
      {/* directional shadow on inner cliff faces */}
      <path
        d="M0 900 L0 240
           C 90 220, 200 245, 280 290
           C 360 335, 420 410, 470 500
           C 510 575, 545 645, 600 720
           C 660 790, 740 855, 830 870
           L 870 873 L 0 900 Z"
        fill="url(#mid-shade-right)"
      />
      <path
        d="M1920 900 L1920 240
           C 1830 220, 1720 245, 1640 290
           C 1560 335, 1500 410, 1450 500
           C 1410 575, 1375 645, 1320 720
           C 1260 790, 1180 855, 1090 870
           L 1050 873 L 1920 900 Z"
        fill="url(#mid-shade-left)"
      />
      {/* grain */}
      <path
        d="M0 900 L0 240
           C 90 220, 200 245, 280 290
           C 360 335, 420 410, 470 500
           C 510 575, 545 645, 600 720
           C 660 790, 740 855, 830 870
           L 870 873 Q 960 880, 1050 873 L 1090 870
           C 1180 855, 1260 790, 1320 720
           C 1375 645, 1410 575, 1450 500
           C 1500 410, 1560 335, 1640 290
           C 1720 245, 1830 220, 1920 240
           L 1920 900 Z"
        filter="url(#mid-grain)"
        opacity="0.5"
      />
      {/* foliage tufts crowning the mid ridge */}
      <g fill="url(#foliage-mid)">
        <ellipse cx="120" cy="232" rx="44" ry="14" />
        <ellipse cx="190" cy="226" rx="36" ry="12" />
        <ellipse cx="260" cy="250" rx="32" ry="11" />
        <ellipse cx="1660" cy="232" rx="44" ry="14" />
        <ellipse cx="1730" cy="226" rx="36" ry="12" />
        <ellipse cx="1800" cy="250" rx="32" ry="11" />
      </g>
    </svg>
  )
}

function FrontCliffs() {
  return (
    <svg
      viewBox="0 0 1920 900"
      preserveAspectRatio="xMidYMax slice"
      width="100%"
      height="100%"
    >
      <defs>
        <linearGradient id="front-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e69468" />
          <stop offset="50%" stopColor="#b85b34" />
          <stop offset="100%" stopColor="#5a2415" />
        </linearGradient>
        <linearGradient id="front-shade-left" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0%" stopColor="#3a1408" stopOpacity="0.6" />
          <stop offset="70%" stopColor="#3a1408" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="front-shade-right" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#3a1408" stopOpacity="0.6" />
          <stop offset="70%" stopColor="#3a1408" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="foliage-front" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#9ec48a" />
          <stop offset="100%" stopColor="#3f6d3d" />
        </linearGradient>
        <filter id="front-grain" x="0" y="0" width="100%" height="100%">
          <feTurbulence baseFrequency="1.05" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix
            values="0 0 0 0 0.24  0 0 0 0 0.10  0 0 0 0 0.05  0 0 0 0.30 0"
          />
          <feComposite in2="SourceGraphic" operator="in" />
        </filter>
      </defs>
      {/* dramatic vertical cliff silhouette, narrower V */}
      <path
        d="M0 900 L0 110
           C 30 100, 70 130, 120 200
           L 210 360
           C 250 460, 280 555, 320 640
           C 360 720, 420 805, 510 855
           L 580 882
           Q 720 905, 870 905
           L 1050 905
           Q 1200 905, 1340 882
           L 1410 855
           C 1500 805, 1560 720, 1600 640
           C 1640 555, 1670 460, 1710 360
           L 1800 200
           C 1850 130, 1890 100, 1920 110
           L 1920 900 Z"
        fill="url(#front-grad)"
      />
      {/* shadow on inner faces */}
      <path
        d="M0 900 L0 110
           C 30 100, 70 130, 120 200
           L 210 360
           C 250 460, 280 555, 320 640
           C 360 720, 420 805, 510 855
           L 580 882 L 0 900 Z"
        fill="url(#front-shade-right)"
      />
      <path
        d="M1920 900 L1920 110
           C 1890 100, 1850 130, 1800 200
           L 1710 360
           C 1670 460, 1640 555, 1600 640
           C 1560 720, 1500 805, 1410 855
           L 1340 882 L 1920 900 Z"
        fill="url(#front-shade-left)"
      />
      {/* striations on cliff faces — thin lighter strokes suggesting rock layers */}
      <g stroke="#e8b290" strokeWidth="1.4" strokeLinecap="round" opacity="0.32" fill="none">
        <path d="M 70 280 Q 130 290, 190 320" />
        <path d="M 100 400 Q 170 415, 235 445" />
        <path d="M 140 540 Q 215 560, 285 595" />
        <path d="M 1730 280 Q 1790 290, 1850 320" />
        <path d="M 1685 400 Q 1750 415, 1820 445" />
        <path d="M 1635 540 Q 1705 560, 1780 595" />
      </g>
      {/* grain */}
      <path
        d="M0 900 L0 110
           C 30 100, 70 130, 120 200
           L 210 360
           C 250 460, 280 555, 320 640
           C 360 720, 420 805, 510 855
           L 580 882 Q 720 905, 870 905 L 1050 905
           Q 1200 905, 1340 882 L 1410 855
           C 1500 805, 1560 720, 1600 640
           C 1640 555, 1670 460, 1710 360
           L 1800 200 C 1850 130, 1890 100, 1920 110
           L 1920 900 Z"
        filter="url(#front-grain)"
        opacity="0.55"
      />
      {/* foliage crowns on the high ledges */}
      <g fill="url(#foliage-front)">
        {/* left ridge */}
        <ellipse cx="36" cy="118" rx="40" ry="14" />
        <ellipse cx="90" cy="148" rx="36" ry="12" />
        <ellipse cx="150" cy="210" rx="42" ry="13" />
        <ellipse cx="210" cy="280" rx="30" ry="10" />
        {/* right ridge */}
        <ellipse cx="1884" cy="118" rx="40" ry="14" />
        <ellipse cx="1830" cy="148" rx="36" ry="12" />
        <ellipse cx="1770" cy="210" rx="42" ry="13" />
        <ellipse cx="1710" cy="280" rx="30" ry="10" />
      </g>
    </svg>
  )
}

function ForegroundGrass() {
  return (
    <svg
      viewBox="0 0 1920 900"
      preserveAspectRatio="xMidYMax slice"
      width="100%"
      height="100%"
    >
      <defs>
        <linearGradient id="grass-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#b6cf9a" />
          <stop offset="60%" stopColor="#6c9a5e" />
          <stop offset="100%" stopColor="#2f5530" />
        </linearGradient>
        <linearGradient id="rock-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8a4631" />
          <stop offset="100%" stopColor="#3a1a10" />
        </linearGradient>
      </defs>
      {/* low grass strip along the very bottom — clusters left, right, and one small in middle */}
      <g fill="url(#grass-grad)">
        <path d="M -20 900 L -20 830 Q 40 815, 100 822 Q 180 835, 260 815 Q 320 800, 380 820 Q 440 835, 510 825 L 560 900 Z" />
        <path d="M 1920 900 L 1940 830 Q 1880 815, 1820 822 Q 1740 835, 1660 815 Q 1600 800, 1540 820 Q 1480 835, 1410 825 L 1360 900 Z" />
        <path d="M 760 900 L 760 880 Q 820 870, 880 878 Q 960 888, 1040 878 Q 1100 870, 1160 880 L 1160 900 Z" />
      </g>
      {/* tiny rocks in the foreground */}
      <g fill="url(#rock-grad)">
        <ellipse cx="240" cy="868" rx="22" ry="9" />
        <ellipse cx="490" cy="876" rx="14" ry="6" />
        <ellipse cx="1430" cy="868" rx="22" ry="9" />
        <ellipse cx="1680" cy="876" rx="14" ry="6" />
      </g>
      {/* a few taller grass blades */}
      <g
        stroke="#3f6d3d"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
        opacity="0.85"
      >
        <path d="M 60 820 Q 64 800, 68 786" />
        <path d="M 130 818 Q 132 800, 138 790" />
        <path d="M 350 825 Q 354 808, 360 798" />
        <path d="M 1860 820 Q 1856 800, 1852 786" />
        <path d="M 1790 818 Q 1788 800, 1782 790" />
        <path d="M 1570 825 Q 1566 808, 1560 798" />
      </g>
    </svg>
  )
}

function Bird({
  x,
  y,
  scale,
  delay,
}: {
  x: number
  y: number
  scale: number
  delay: number
}) {
  return (
    <svg
      className="canyon__bird"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: `scale(${scale})`,
        animationDelay: `${delay}s`,
      }}
      viewBox="0 0 40 16"
      width="40"
      height="16"
      aria-hidden="true"
    >
      <path
        d="M2 12 Q 8 4, 14 10 Q 20 14, 26 10 Q 32 4, 38 12"
        stroke="#3a2a1a"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}
