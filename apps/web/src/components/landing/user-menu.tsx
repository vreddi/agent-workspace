import { SignOutButton, useClerk, useUser } from '@clerk/tanstack-react-start'
import { Link } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'

function initialsFrom(name: string | null | undefined, fallback: string): string {
  if (!name) return fallback
  const parts = name.trim().split(/\s+/).slice(0, 2)
  return parts.map((p) => p.charAt(0).toUpperCase()).join('') || fallback
}

/**
 * Custom auth pill. No <UserButton>; only Clerk hooks.
 * Renders avatar trigger + a tiny popover with name/email/links.
 */
export function UserMenu() {
  const { isLoaded, user } = useUser()
  const { signOut } = useClerk()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (!rootRef.current) return
      if (!rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!isLoaded || !user) {
    return <div className="landing-avatar landing-avatar--ghost" aria-hidden="true" />
  }

  const name = user.fullName ?? [user.firstName, user.lastName].filter(Boolean).join(' ')
  const email = user.primaryEmailAddress?.emailAddress ?? ''
  const initials = initialsFrom(name, 'Y')

  return (
    <div className="landing-user" ref={rootRef}>
      <button
        type="button"
        className="landing-avatar"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        title={name || email}
      >
        {user.imageUrl ? (
          <img src={user.imageUrl} alt={name || 'Account'} />
        ) : (
          <span>{initials}</span>
        )}
      </button>
      {open && (
        <div className="landing-user__menu" role="menu">
          <div className="landing-user__head">
            <div className="landing-user__name">{name || 'Signed in'}</div>
            {email && <div className="landing-user__email">{email}</div>}
          </div>
          <Link
            to="/app"
            className="landing-user__item"
            onClick={() => setOpen(false)}
            role="menuitem"
          >
            <ArrowRightSvg /> Open Today
          </Link>
          <SignOutButton>
            <button
              type="button"
              className="landing-user__item landing-user__item--quiet"
              onClick={() => void signOut()}
              role="menuitem"
            >
              <ExitSvg /> Sign out
            </button>
          </SignOutButton>
        </div>
      )}
    </div>
  )
}

function ArrowRightSvg() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  )
}

function ExitSvg() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
    </svg>
  )
}
