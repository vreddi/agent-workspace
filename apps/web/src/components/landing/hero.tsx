import { SignedIn, SignedOut, SignInButton } from '@clerk/tanstack-react-start'
import { Link } from '@tanstack/react-router'

/**
 * Wordmarks below are intentionally invented to avoid implying real endorsements.
 * Each is a small typographic study; the row reads as personality, not logos.
 */
const WORDMARKS: { label: string; style: string }[] = [
  { label: 'littleseed', style: 'lower-serif' },
  { label: 'FIELDNOTES', style: 'tight-sans' },
  { label: 'meridian·', style: 'mixed' },
  { label: 'northstand', style: 'lower-mono' },
  { label: 'Atelier & Co', style: 'lower-italic' },
  { label: 'TYPEWRITER', style: 'wide-mono' },
]

export function Hero() {
  return (
    <section className="landing-hero">
      <span className="landing-eyebrow">
        <span className="landing-eyebrow__dot" />
        <span className="landing-eyebrow__strong">New</span>
        <span className="landing-eyebrow__divider">·</span>
        Today&rsquo;s AI brief learns your week
      </span>

      <h1 className="landing-headline">
        Make today a small,{' '}
        <em className="landing-headline__em">completable</em> thing.
      </h1>

      <p className="landing-sub">
        Today is a personal task manager with an AI co-pilot. Capture what&rsquo;s on
        your mind, then let it shape a focused day around the work that actually
        matters.
      </p>

      <div className="landing-cta-row">
        <SignedOut>
          <SignInButton mode="modal">
            <button type="button" className="landing-btn landing-btn--primary">
              Try Today free
              <ArrowSvg />
            </button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <Link to="/app" className="landing-btn landing-btn--primary">
            Open Today
            <ArrowSvg />
          </Link>
        </SignedIn>
        <a href="#features" className="landing-btn landing-btn--outline">
          How it works
        </a>
      </div>

      <div className="landing-trust">
        <p className="landing-trust__label">Loved by makers at</p>
        <div className="landing-trust__row">
          {WORDMARKS.map((w) => (
            <span
              key={w.label}
              className={`landing-trust__mark landing-trust__mark--${w.style}`}
            >
              {w.label}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

function ArrowSvg() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  )
}
