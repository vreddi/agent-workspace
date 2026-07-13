import { SignedIn, SignedOut, SignInButton } from '@clerk/tanstack-react-start'
import { Link } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import { ArrowSvg } from './hero'

/* ── Scroll reveal ──────────────────────────────────────────────
   One shared IntersectionObserver; elements get data-in once and
   are un-observed. CSS handles the transition (and turns it off
   under prefers-reduced-motion). */
let io: IntersectionObserver | null = null
function observeReveal(el: Element) {
  io ??= new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.setAttribute('data-in', '')
          io?.unobserve(e.target)
        }
      }
    },
    { threshold: 0.15, rootMargin: '0px 0px -6% 0px' },
  )
  io.observe(el)
}

function Reveal({
  className,
  children,
  delay,
}: {
  className?: string
  children: React.ReactNode
  delay?: number
}) {
  const ref = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (ref.current) observeReveal(ref.current)
  }, [])
  return (
    <div
      ref={ref}
      className={`lp-reveal${className ? ` ${className}` : ''}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  )
}

function StartFreeButton({ label = 'Start free' }: { label?: string }) {
  return (
    <>
      <SignedOut>
        <SignInButton mode="modal">
          <button type="button" className="lp-btn lp-btn--primary">
            {label}
            <ArrowSvg />
          </button>
        </SignInButton>
      </SignedOut>
      <SignedIn>
        <Link to="/app" className="lp-btn lp-btn--primary">
          Open Today
          <ArrowSvg />
        </Link>
      </SignedIn>
    </>
  )
}

/* ── Features: one clear day ───────────────────────────────── */

export function Features() {
  return (
    <section id="features" className="lp-section lp-features">
      <div className="lp-container">
        <Reveal className="lp-section-head">
          <h2 className="lp-h2">One clear day, every day.</h2>
          <p className="lp-lede">
            No dashboards, no unread counts, nothing blinking. Today shows the
            work you chose for today, and keeps everything else a click away.
          </p>
        </Reveal>

        <div className="lp-story">
          <Reveal className="lp-story__text">
            <h3 className="lp-h3">Capture in seconds</h3>
            <p>
              A task needs a title and nothing else. Priority, deadline,
              difficulty and notes are there when you want them, and invisible
              when you don&rsquo;t.
            </p>
          </Reveal>
          <Reveal className="lp-story__art" delay={80}>
            <CaptureVignette />
          </Reveal>
        </div>

        <div className="lp-story lp-story--flip">
          <Reveal className="lp-story__text">
            <h3 className="lp-h3">Goals on a gentle board</h3>
            <p>
              Group tasks under goals and move them across a quiet kanban.
              Each goal wears a coin for its category, tracks its cost, and
              nudges you before a deadline slips.
            </p>
          </Reveal>
          <Reveal className="lp-story__art" delay={80}>
            <BoardVignette />
          </Reveal>
        </div>

        <div className="lp-story">
          <Reveal className="lp-story__text">
            <h3 className="lp-h3">Numbers that answer honestly</h3>
            <p>
              Attach a metric to a goal, log readings as you go, and the trend
              line answers the only question that matters: is this working?
            </p>
          </Reveal>
          <Reveal className="lp-story__art" delay={80}>
            <MetricVignette />
          </Reveal>
        </div>
      </div>
    </section>
  )
}

function CaptureVignette() {
  return (
    <svg className="lp-vignette" viewBox="0 0 360 240" role="img" aria-label="A task list with a quick-capture field">
      <rect x="10" y="10" width="340" height="220" rx="20" fill="#fffdf7" stroke="#eadfcb" />
      {/* capture field */}
      <rect x="32" y="32" width="296" height="44" rx="13" fill="#faf4e7" stroke="#e8dcc4" />
      <text x="50" y="59" fontSize="15" fontWeight="600" fill="#3d3a33">
        renew passport
      </text>
      <rect x="282" y="42" width="34" height="24" rx="7" fill="#efe6d2" />
      <text x="291" y="59" fontSize="12" fontWeight="700" fill="#8a8064">
        ⏎
      </text>
      {/* rows */}
      <g>
        <circle cx="48" cy="108" r="10" fill="none" stroke="#cfc4ac" strokeWidth="2" />
        <text x="70" y="113" fontSize="14" fontWeight="600" fill="#3d3a33">
          buy bird seed
        </text>
      </g>
      <line x1="32" y1="132" x2="328" y2="132" stroke="#f0e9d8" />
      <g>
        <circle cx="48" cy="156" r="10" fill="none" stroke="#cfc4ac" strokeWidth="2" />
        <text x="70" y="161" fontSize="14" fontWeight="600" fill="#3d3a33">
          call the bank
        </text>
        <text x="270" y="161" fontSize="12" fontWeight="600" fill="#b0741f">
          due today
        </text>
      </g>
      <line x1="32" y1="180" x2="328" y2="180" stroke="#f0e9d8" />
      <g opacity="0.62">
        <circle cx="48" cy="204" r="10" fill="#a8c98b" stroke="#8bb26e" strokeWidth="2" />
        <path d="M43.5 204 l3.4 3.4 l6-6.8" stroke="#fffdf7" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        <text x="70" y="209" fontSize="14" fontWeight="600" fill="#8a8064" textDecoration="line-through">
          water the ferns
        </text>
      </g>
    </svg>
  )
}

function BoardVignette() {
  return (
    <svg className="lp-vignette" viewBox="0 0 360 240" role="img" aria-label="A three-column goal board with coin crests">
      <rect x="10" y="10" width="340" height="220" rx="20" fill="#fffdf7" stroke="#eadfcb" />
      {(
        [
          { x: 28, label: 'Not started' },
          { x: 138, label: 'In motion' },
          { x: 248, label: 'Done' },
        ] as const
      ).map((col) => (
        <g key={col.x}>
          <text x={col.x + 6} y="42" fontSize="11.5" fontWeight="700" fill="#8a8064" letterSpacing="0.4">
            {col.label}
          </text>
          <rect x={col.x} y="52" width="84" height="164" rx="12" fill="#faf5e9" />
        </g>
      ))}
      {/* cards */}
      <g>
        <rect x="34" y="62" width="72" height="52" rx="9" fill="#fffdf7" stroke="#eadfcb" />
        <image href="/goal-types/travel.png" x="40" y="68" width="20" height="20" />
        <rect x="40" y="94" width="52" height="5" rx="2.5" fill="#ded2b8" />
        <rect x="40" y="103" width="36" height="5" rx="2.5" fill="#ece2cc" />
      </g>
      <g>
        <rect x="144" y="62" width="72" height="52" rx="9" fill="#fffdf7" stroke="#e4b352" strokeWidth="1.6" />
        <image href="/goal-types/finance.png" x="150" y="68" width="20" height="20" />
        <rect x="150" y="94" width="52" height="5" rx="2.5" fill="#ded2b8" />
        <rect x="150" y="103" width="42" height="5" rx="2.5" fill="#ece2cc" />
      </g>
      <g>
        <rect x="144" y="122" width="72" height="52" rx="9" fill="#fffdf7" stroke="#eadfcb" />
        <image href="/goal-types/learning.png" x="150" y="128" width="20" height="20" />
        <rect x="150" y="154" width="46" height="5" rx="2.5" fill="#ded2b8" />
        <rect x="150" y="163" width="30" height="5" rx="2.5" fill="#ece2cc" />
      </g>
      <g opacity="0.72">
        <rect x="254" y="62" width="72" height="52" rx="9" fill="#fffdf7" stroke="#eadfcb" />
        <image href="/goal-types/health-wellness.png" x="260" y="68" width="20" height="20" />
        <rect x="260" y="94" width="48" height="5" rx="2.5" fill="#ded2b8" />
        <path d="M310 74 l4 4 l7-8" stroke="#8bb26e" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      </g>
    </svg>
  )
}

function MetricVignette() {
  return (
    <svg className="lp-vignette" viewBox="0 0 360 240" role="img" aria-label="A rising metric trend line">
      <rect x="10" y="10" width="340" height="220" rx="20" fill="#fffdf7" stroke="#eadfcb" />
      <text x="32" y="46" fontSize="14" fontWeight="700" fill="#3d3a33">
        morning pages
      </text>
      <text x="32" y="66" fontSize="12" fontWeight="600" fill="#8a8064">
        21 readings · trending up
      </text>
      {/* grid */}
      <g stroke="#f0e9d8">
        <line x1="32" y1="110" x2="328" y2="110" />
        <line x1="32" y1="150" x2="328" y2="150" />
        <line x1="32" y1="190" x2="328" y2="190" />
      </g>
      {/* area + line */}
      <path
        d="M40 186 C 90 182, 110 168, 150 158 C 190 148, 210 140, 250 122 C 280 109, 300 100, 318 92 L318 200 L40 200 Z"
        fill="#dcecc9"
        opacity="0.55"
      />
      <path
        d="M40 186 C 90 182, 110 168, 150 158 C 190 148, 210 140, 250 122 C 280 109, 300 100, 318 92"
        fill="none"
        stroke="#79a85d"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <g fill="#fffdf7" stroke="#79a85d" strokeWidth="2.4">
        <circle cx="40" cy="186" r="4.5" />
        <circle cx="150" cy="158" r="4.5" />
        <circle cx="250" cy="122" r="4.5" />
        <circle cx="318" cy="92" r="5" />
      </g>
      {/* sparkle at the tip */}
      <path
        d="M334 70 C 334.7 75.3 336.7 77.3 342 78 C 336.7 78.7 334.7 80.7 334 86 C 333.3 80.7 331.3 78.7 326 78 C 331.3 77.3 333.3 75.3 334 70"
        fill="#e9c66e"
      />
    </svg>
  )
}

/* ── Village ───────────────────────────────────────────────── */

const CRESTS = [
  { src: '/goal-types/finance.png', label: 'Finance' },
  { src: '/goal-types/health-wellness.png', label: 'Health & wellness' },
  { src: '/goal-types/learning.png', label: 'Learning' },
  { src: '/goal-types/travel.png', label: 'Travel' },
  { src: '/goal-types/adventure.png', label: 'Adventure' },
  { src: '/goal-types/relationships.png', label: 'Relationships' },
  { src: '/goal-types/skill-mastery.png', label: 'Skill mastery' },
]

export function Village() {
  return (
    <section id="village" className="lp-section lp-village">
      <div className="lp-container">
        <Reveal className="lp-section-head">
          <h2 className="lp-h2">Your helpers live in a tiny village.</h2>
          <p className="lp-lede">
            Every agent in Today is a character with a name, a personality and
            a house on the map. They wander by day, sleep by night, and
            they&rsquo;re growing into real helpers that file, remind and
            follow up on the work you give them.
          </p>
        </Reveal>

        <Reveal className="lp-dialogue" delay={60}>
          <div className="lp-dialogue__box">
            <span className="lp-dialogue__name">Maple</span>
            <p className="lp-dialogue__line">
              I filed &ldquo;renew passport&rdquo; under Travel. It&rsquo;s due
              in three weeks, so I&rsquo;ll knock on your door next Monday.
            </p>
          </div>
        </Reveal>

        <Reveal className="lp-crests-head" delay={100}>
          <h3 className="lp-h3">Every goal wears a crest</h3>
          <p>
            Pick a category and your goal gets its coin, painted in the same
            style as the village.
          </p>
        </Reveal>
        <div className="lp-crests">
          {CRESTS.map((c, i) => (
            <Reveal key={c.src} className="lp-crest" delay={i * 55}>
              <img src={c.src} alt={`${c.label} goal coin`} width={84} height={84} loading="lazy" />
              <span>{c.label}</span>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Accountability ────────────────────────────────────────── */

export function Accountability() {
  return (
    <section id="accountability" className="lp-section lp-account">
      <div className="lp-container lp-container--narrow">
        <Reveal className="lp-section-head">
          <h2 className="lp-h2">Accountability without the guilt.</h2>
          <p className="lp-lede">
            Built neurodivergent-first: for ADHD, autism and anxious brains,
            which makes it calmer for everyone. No streaks, no confetti, no
            red badges.
          </p>
        </Reveal>

        <div className="lp-account__rows">
          <Reveal className="lp-account__row">
            <BellIcon />
            <div>
              <h3 className="lp-h3">Nudges, not alarms</h3>
              <p>
                A quiet reminder before a deadline, and plain words like
                &ldquo;2 overdue&rdquo; when something slips. Nothing pulses,
                nothing shames.
              </p>
            </div>
          </Reveal>
          <Reveal className="lp-account__row" delay={70}>
            <PeopleIcon />
            <div>
              <h3 className="lp-h3">Share the load</h3>
              <p>
                Hand a task to a partner or a friend. You both see it, either
                of you can finish it, and the history stays honest.
              </p>
            </div>
          </Reveal>
          <Reveal className="lp-account__row" delay={140}>
            <FocusIcon />
            <div>
              <h3 className="lp-h3">One focus per screen</h3>
              <p>
                Every screen has a single primary thing and a single primary
                action. If it ever feels like a notification center, we broke
                it.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

function BellIcon() {
  return (
    <span className="lp-account__icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.7 21a2 2 0 0 1-3.4 0" />
      </svg>
    </span>
  )
}

function PeopleIcon() {
  return (
    <span className="lp-account__icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    </span>
  )
}

function FocusIcon() {
  return (
    <span className="lp-account__icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
      </svg>
    </span>
  )
}

/* ── Pricing ───────────────────────────────────────────────── */

export function Pricing() {
  return (
    <section id="pricing" className="lp-section lp-pricing">
      <div className="lp-container">
        <Reveal className="lp-section-head">
          <h2 className="lp-h2">Simple pricing.</h2>
          <p className="lp-lede">Start free. Upgrade when your village earns it.</p>
        </Reveal>

        <div className="lp-plans">
          <Reveal className="lp-plan">
            <h3 className="lp-plan__name">Free</h3>
            <p className="lp-plan__price">
              $0 <span>forever</span>
            </p>
            <ul className="lp-plan__list">
              <li>Unlimited tasks, goals and metrics</li>
              <li>The village and its residents</li>
              <li>Web, iPhone and Android</li>
              <li>Deadline reminders</li>
            </ul>
            <StartFreeButton />
          </Reveal>

          <Reveal className="lp-plan lp-plan--plus" delay={90}>
            <h3 className="lp-plan__name">Plus</h3>
            <p className="lp-plan__price">
              $6 <span>per month</span>
            </p>
            <ul className="lp-plan__list">
              <li>Everything in Free</li>
              <li>An AI brief that shapes your day</li>
              <li>Smarter nudges from your agents</li>
              <li>Shared tasks with anyone</li>
              <li>First access to new villagers</li>
            </ul>
            <StartFreeButton label="Start free, upgrade later" />
          </Reveal>
        </div>
        <Reveal delay={140}>
          <p className="lp-pricing__note">
            Plus rolls out gradually while Today is in beta. Everyone starts
            on Free.
          </p>
        </Reveal>
      </div>
    </section>
  )
}

/* ── FAQ ───────────────────────────────────────────────────── */

export const FAQ_ITEMS = [
  {
    q: 'What is Today?',
    a: 'Today is a personal task manager with goals, metrics and reminders, plus a twist: your AI helpers are characters living in a small pixel village. You capture tasks; they keep you gently accountable.',
  },
  {
    q: 'Is Today free?',
    a: 'Yes. Tasks, goals, metrics, reminders and the village are free. A Plus plan with AI features is rolling out gradually during the beta.',
  },
  {
    q: 'How is it different from other to-do apps?',
    a: 'It is built neurodivergent-first, for ADHD, autism and anxiety-prone brains. One focus per screen, no streaks, no badges, no noise. Accountability comes from kind nudges and visible progress, not guilt.',
  },
  {
    q: 'What do the village agents actually do?',
    a: 'Right now they are the heart of the app: characters with names, personalities and houses, on a map with a real day and night cycle. They are growing into helpers that file tasks, remind you at the right moment and follow up on shared work.',
  },
  {
    q: 'Is there a mobile app?',
    a: 'Yes. Today runs in the browser and as a native app on iPhone and Android, with full parity for tasks, goals and metrics.',
  },
]

export function Faq() {
  return (
    <section id="faq" className="lp-section lp-faq">
      <div className="lp-container lp-container--narrow">
        <Reveal className="lp-section-head">
          <h2 className="lp-h2">Questions, answered plainly.</h2>
        </Reveal>
        <Reveal delay={60}>
          <div className="lp-faq__list">
            {FAQ_ITEMS.map((item) => (
              <details key={item.q} className="lp-faq__item">
                <summary>
                  {item.q}
                  <PlusGlyph />
                </summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function PlusGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" className="lp-faq__glyph">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  )
}

/* ── Night: final CTA + footer ─────────────────────────────── */

const STARS: { left: string; top: string; size: number; delay: number }[] = [
  { left: '8%', top: '18%', size: 10, delay: 0 },
  { left: '22%', top: '34%', size: 7, delay: 1.8 },
  { left: '36%', top: '12%', size: 8, delay: 3.2 },
  { left: '54%', top: '28%', size: 6, delay: 0.9 },
  { left: '68%', top: '10%', size: 9, delay: 2.4 },
  { left: '82%', top: '30%', size: 7, delay: 4.1 },
  { left: '93%', top: '16%', size: 10, delay: 1.2 },
  { left: '45%', top: '42%', size: 5, delay: 5 },
  { left: '15%', top: '52%', size: 6, delay: 2.9 },
  { left: '75%', top: '48%', size: 6, delay: 3.7 },
]

export function Night() {
  return (
    <section className="lp-night">
      <div className="lp-night__sky" aria-hidden="true">
        {STARS.map((s, i) => (
          <svg
            key={i}
            className="lp-night__star"
            style={{ left: s.left, top: s.top, width: s.size, animationDelay: `${s.delay}s` }}
            viewBox="0 0 24 24"
          >
            <path
              d="M12 0 C13 8 16 11 24 12 C16 13 13 16 12 24 C11 16 8 13 0 12 C8 11 11 8 12 0"
              fill="#f4e9c5"
            />
          </svg>
        ))}
        <svg className="lp-night__moon" viewBox="0 0 64 64">
          <path
            d="M44 8 A26 26 0 1 0 58 42 A21 21 0 0 1 44 8 Z"
            fill="#f4e9c5"
          />
        </svg>
      </div>

      <div className="lp-container lp-night__content">
        <Reveal>
          <h2 className="lp-h2 lp-night__title">Your village is waiting.</h2>
          <p className="lp-lede lp-night__lede">
            Start with one small task tonight. The rest can wait for morning.
          </p>
          <div className="lp-cta-row lp-cta-row--night">
            <StartFreeButton />
          </div>
        </Reveal>
      </div>

      <VillageAsleep />

      <footer className="lp-footer">
        <div className="lp-container lp-footer__inner">
          <span className="lp-footer__brand">Today</span>
          <nav className="lp-footer__nav" aria-label="Footer">
            <a href="#features">Features</a>
            <a href="#village">Village</a>
            <a href="#pricing">Pricing</a>
            <a href="#faq">FAQ</a>
          </nav>
          <span className="lp-footer__note">
            Made for busy heads. © {new Date().getFullYear()} Today
          </span>
        </div>
      </footer>
    </section>
  )
}

function VillageAsleep() {
  return (
    <svg
      className="lp-night__village"
      viewBox="0 0 1440 200"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
    >
      <path
        d="M0 200 L0 120 Q 260 70 520 106 Q 760 138 1000 100 Q 1240 64 1440 110 L1440 200 Z"
        fill="#1d1e40"
      />
      {/* sleeping houses: dark silhouettes, one warm window each */}
      <g>
        <SleepHouse x={330} y={82} />
        <SleepHouse x={700} y={102} lit />
        <SleepHouse x={1080} y={76} />
      </g>
      {/* silhouette trees */}
      <g fill="#161733">
        <circle cx="220" cy="96" r="18" />
        <rect x="217" y="106" width="6" height="14" rx="2" />
        <circle cx="880" cy="112" r="15" />
        <rect x="877" y="120" width="6" height="12" rx="2" />
        <circle cx="1240" cy="88" r="17" />
        <rect x="1237" y="98" width="6" height="13" rx="2" />
      </g>
      <path
        d="M0 200 L0 158 Q 360 122 720 150 Q 1080 176 1440 144 L1440 200 Z"
        fill="#14152e"
      />
    </svg>
  )
}

function SleepHouse({ x, y, lit }: { x: number; y: number; lit?: boolean }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="-18" y="6" width="36" height="26" rx="3" fill="#161733" />
      <path d="M-23 10 L0 -12 L23 10 Q 23 14 18 14 L-18 14 Q -23 14 -23 10 Z" fill="#101129" />
      <rect x="4" y="14" width="9" height="9" rx="2" fill={lit ? '#f7d98b' : '#232450'}>
        {lit ? <animate attributeName="opacity" values="1;0.75;1" dur="6s" repeatCount="indefinite" /> : null}
      </rect>
      <rect x="9" y="-9" width="6" height="10" rx="1.5" fill="#101129" />
    </g>
  )
}
