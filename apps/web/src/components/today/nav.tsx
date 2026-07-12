import { api } from '@convex/_generated/api'
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
import { useMutation, useQuery } from 'convex/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { CapturePalette, type CaptureInput } from './capture-palette'
import { initialsFromName } from './helpers'

export type NavPage = 'today' | 'tasks' | 'day' | 'goals' | 'agents'

const NAV_LINKS = [
  { page: 'today', to: '/app', label: 'Today' },
  { page: 'tasks', to: '/tasks', label: 'Tasks' },
  { page: 'day', to: '/day', label: 'Day view' },
  { page: 'goals', to: '/goals', label: 'Goals' },
  { page: 'agents', to: '/agents', label: 'Agents' },
] as const

function UserMenu({ onOpenSettings }: { onOpenSettings?: () => void }) {
  const { user } = useUser()
  const { signOut } = useClerk()
  const navigate = useNavigate()
  // Today renders its own in-place tweaks panel; everywhere else the menu
  // item routes to the dedicated settings page.
  const openSettings =
    onOpenSettings ?? (() => void navigate({ to: '/settings' }))
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
        <DropdownMenuItem
          onSelect={(event) => {
            event.preventDefault()
            openSettings()
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
 * Renders inside `.today-root`, so it needs `todayStyles` on the page. The
 * "New task" button and the N shortcut open the quick-capture palette in
 * place, on whatever page you're on — no navigation. `onOpenSettings` opens
 * the Today tweaks panel in place; without it the Settings menu item routes
 * to the dedicated `/settings` page.
 */
export function Nav({
  active,
  onOpenSettings,
}: {
  /** Omit on detail pages (task, goal) — no top-level link is current. */
  active?: NavPage
  onOpenSettings?: () => void
}) {
  const [paletteOpen, setPaletteOpen] = useState(false)
  // Subscribe to goals only once the palette has been opened — no need to
  // pay for the query on every page just to power the "New task" button.
  const [everOpened, setEverOpened] = useState(false)
  const goals = useQuery(api.goals.list, everOpened ? {} : 'skip')
  const createTask = useMutation(api.tasks.create)

  const openPalette = useCallback(() => {
    setEverOpened(true)
    setPaletteOpen(true)
  }, [])

  const openRef = useRef(openPalette)
  openRef.current = openPalette
  // N opens the palette from anywhere; Escape closes it.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setPaletteOpen(false)
        return
      }
      if (
        (e.key === 'n' || e.key === 'N') &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey
      ) {
        const target = e.target as HTMLElement | null
        const tag = (target?.tagName ?? '').toLowerCase()
        if (tag === 'input' || tag === 'textarea' || target?.isContentEditable)
          return
        e.preventDefault()
        openRef.current()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  async function handleCapture(input: CaptureInput) {
    const softDeadline = input.targetDate
      ? new Date(`${input.targetDate}T23:59:00`).getTime()
      : null
    await createTask({
      title: input.title,
      estimateMinutes: input.estimateMinutes,
      softDeadline,
      allowEarlyCompletion: input.allowEarlyCompletion,
      scheduledStartMinutes: input.scheduledStartMinutes,
      priority: input.priority,
      difficulty: input.difficulty,
      emoji: input.emoji,
      goalId: input.goalId,
    })
  }

  return (
    <>
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
        <button className="t-btn-create" onClick={openPalette} type="button">
          New task
          <span className="t-kbd t-kbd--on-accent">N</span>
        </button>
        <UserMenu onOpenSettings={onOpenSettings} />
      </header>
      <CapturePalette
        open={paletteOpen}
        goals={goals}
        onClose={() => setPaletteOpen(false)}
        onSubmit={handleCapture}
      />
    </>
  )
}
