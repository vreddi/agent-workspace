import { SignedIn, SignedOut, SignInButton } from '@clerk/tanstack-react-start'
import { UserMenu } from './user-menu'

const NAV_LINKS: { label: string; href: string }[] = [
  { label: 'Features', href: '#features' },
  { label: 'Village', href: '#village' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
]

export function Header() {
  return (
    <header className="landing-header">
      <div className="landing-header__left">
        <Logo />
      </div>

      <nav className="landing-header__nav" aria-label="Primary">
        {NAV_LINKS.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="landing-header__link"
          >
            {link.label}
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
            <stop offset="0%" stopColor="#f2c14e" />
            <stop offset="100%" stopColor="#d98a3d" />
          </linearGradient>
        </defs>
        {/* sun arc */}
        <path d="M4 22 A 12 12 0 0 1 28 22" fill="url(#logo-grad)" />
        {/* horizon line */}
        <rect x="3" y="23.4" width="26" height="1.6" rx="0.8" fill="#2b2620" />
        {/* tiny ground dot */}
        <circle cx="16" cy="27.5" r="1.2" fill="#2b2620" />
      </svg>
      <span className="landing-header__wordmark">Today</span>
    </a>
  )
}
