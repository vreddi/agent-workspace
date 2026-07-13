import { SignedIn, SignedOut, SignInButton } from '@clerk/tanstack-react-start'
import { Link } from '@tanstack/react-router'
import { Sky } from './sky'

export function Hero() {
  return (
    <section className="lp-hero" id="top">
      <Sky />
      <div className="lp-hero__content">
        <span className="lp-eyebrow">
          <span className="lp-eyebrow__dot" />
          Now in beta
        </span>

        <h1 className="lp-headline">
          Make today a small, <em className="lp-headline__em">completable</em>{' '}
          thing.
        </h1>

        <p className="lp-hero-sub">
          Today is a calm task manager where your AI helpers are characters in
          a tiny pixel village. Capture what&rsquo;s on your mind, shape one
          clear day, and let the villagers keep you gently on track.
        </p>

        <div className="lp-cta-row">
          <SignedOut>
            <SignInButton mode="modal">
              <button type="button" className="lp-btn lp-btn--primary">
                Start free
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
          <a href="#features" className="lp-btn lp-btn--outline">
            See how it works
          </a>
        </div>

        <p className="lp-hero-note">
          Free to start. Works in the browser, on iPhone and on Android.
        </p>
      </div>
    </section>
  )
}

export function ArrowSvg() {
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
