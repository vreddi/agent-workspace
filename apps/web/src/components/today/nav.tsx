import { useClerk, useUser } from '@clerk/tanstack-react-start'
import {
  Avatar as UIAvatar,
  AvatarFallback as UIAvatarFallback,
  AvatarImage as UIAvatarImage,
} from '@org/ui/components/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@org/ui/components/dropdown-menu'
import { Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import { initialsFromName } from './helpers'

export type NavPage = 'today' | 'day' | 'groups' | 'agents'

const NAV_LINKS = [
  { page: 'today', to: '/today', label: 'Today' },
  { page: 'day', to: '/day', label: 'Day view' },
  { page: 'groups', to: '/groups', label: 'Groups' },
  { page: 'agents', to: '/agents', label: 'Agents' },
] as const

function UserMenu({ onOpenSettings }: { onOpenSettings?: () => void }) {
  const { user } = useUser()
  const { signOut } = useClerk()
  const fullName =
    user?.fullName ??
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') ??
    user?.primaryEmailAddress?.emailAddress ??
    'You'
  const email = user?.primaryEmailAddress?.emailAddress
  const initials = initialsFromName(fullName, 'Y')
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Open account menu"
          className="inline-flex shrink-0 cursor-pointer items-center justify-center rounded-[10px] border-0 bg-transparent p-0 outline-none transition-transform focus-visible:ring-2 focus-visible:ring-ring/50 active:translate-y-px"
        >
          <UIAvatar className="size-9 rounded-[10px] after:rounded-[10px]">
            <UIAvatarImage
              src={user?.imageUrl}
              alt={fullName}
              className="rounded-[10px]"
            />
            <UIAvatarFallback className="rounded-[10px] bg-gradient-to-br from-[#18a86b] to-[#0e7a4d] text-sm font-extrabold tracking-tight text-white">
              {initials}
            </UIAvatarFallback>
          </UIAvatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="truncate text-sm font-semibold text-foreground">
            {fullName}
          </span>
          {email && (
            <span className="truncate text-xs font-normal text-muted-foreground">
              {email}
            </span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {onOpenSettings && (
          <>
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault()
                onOpenSettings()
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.36.39.58.91.6 1.51H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem
          variant="destructive"
          onSelect={() => {
            void signOut({ redirectUrl: '/' })
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * Shared top nav for logged-in pages: brand mark, the four main links,
 * New task, avatar menu — same order, same place, every page.
 *
 * Renders inside `.today-root`, so it needs `todayStyles` on the page.
 * `onNewTask` lets the Today page open its capture palette in place;
 * everywhere else the button (and the N shortcut) routes to Today with
 * `?capture=1`, which opens the palette on arrival. `onOpenSettings` is
 * page-local (the Today tweaks panel); the menu item hides without it.
 */
export function Nav({
  active,
  onNewTask,
  onOpenSettings,
}: {
  active: NavPage
  onNewTask?: () => void
  onOpenSettings?: () => void
}) {
  const navigate = useNavigate()
  const handleNewTask =
    onNewTask ??
    (() => {
      void navigate({ to: '/today', search: { capture: true } })
    })

  const newTaskRef = useRef(handleNewTask)
  newTaskRef.current = handleNewTask
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.key === 'n' || e.key === 'N') && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const target = e.target as HTMLElement | null
        const tag = (target?.tagName ?? '').toLowerCase()
        if (tag === 'input' || tag === 'textarea' || target?.isContentEditable) return
        e.preventDefault()
        newTaskRef.current()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <header className="t-nav">
      <div className="t-nav__brand" aria-hidden="true">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 11l8-7 8 7" />
          <path d="M6 9.5V20h12V9.5" />
          <path d="M10 20v-6h4v6" />
        </svg>
      </div>
      <nav className="t-nav__links" aria-label="Main">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.page}
            to={link.to}
            className="t-nav__link"
            data-active={active === link.page || undefined}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <span style={{ flex: 1 }} />
      <button className="t-btn-create" onClick={handleNewTask} type="button">
        New task
        <span className="t-kbd t-kbd--on-accent">N</span>
      </button>
      <UserMenu onOpenSettings={onOpenSettings} />
    </header>
  )
}
