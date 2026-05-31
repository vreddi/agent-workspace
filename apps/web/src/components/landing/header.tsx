import { SignedIn, SignedOut, SignInButton } from '@clerk/tanstack-react-start'
import { useState } from 'react'
import { UserMenu } from './user-menu'

const NAV_LINKS = ['Features', 'Pricing', 'Manifesto', 'Changelog']

export function Header() {
  const [audience, setAudience] = useState<'individual' | 'teams'>('individual')

  return (
    <header className="landing-header">
      <div className="landing-header__left">
        <Logo />
        <div className="landing-header__pills" role="tablist" aria-label="Audience">
          <button
            type="button"
            role="tab"
            aria-selected={audience === 'individual'}
            className="landing-header__pill"
            data-active={audience === 'individual'}
            onClick={() => setAudience('individual')}
          >
            Individual
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={audience === 'teams'}
            className="landing-header__pill"
            data-active={audience === 'teams'}
            onClick={() => setAudience('teams')}
          >
            Teams
          </button>
        </div>
      </div>

      <nav className="landing-header__nav" aria-label="Primary">
        {NAV_LINKS.map((label) => (
          <a key={label} href={`#${label.toLowerCase()}`} className="landing-header__link">
            {label}
          </a>
        ))}
      </nav>

      <div className="landing-header__right">
        <SignedOut>
          <SignInButton mode="modal">
            <button type="button" className="landing-header__signin">
              Sign in
            </button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <UserMenu />
        </SignedIn>
      </div>
    </header>
  )
}

function Logo() {
  return (
    <a href="/" className="landing-header__logo" aria-label="Today, home">
      <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true">
        <defs>
          <linearGradient id="logo-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#e89968" />
            <stop offset="100%" stopColor="#b85b34" />
          </linearGradient>
        </defs>
        {/* sun arc */}
        <path
          d="M4 22 A 12 12 0 0 1 28 22"
          fill="url(#logo-grad)"
        />
        {/* horizon line */}
        <rect x="3" y="23.4" width="26" height="1.6" rx="0.8" fill="#1a1410" />
        {/* tiny ground dot */}
        <circle cx="16" cy="27.5" r="1.2" fill="#1a1410" />
      </svg>
      <span className="landing-header__wordmark">Today</span>
    </a>
  )
}
