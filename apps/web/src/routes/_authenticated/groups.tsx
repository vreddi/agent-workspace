import '@uploadthing/react/styles.css'
import { api } from '@convex/_generated/api'
import type { Doc, Id } from '@convex/_generated/dataModel'
import { Button } from '@org/ui/components/button'
import { cn } from '@org/ui/lib/utils'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Authenticated, useMutation, useQuery } from 'convex/react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { UploadDropzone } from '~/lib/uploadthing'
import { Nav } from '~/components/today/nav'
import { todayStyles } from '~/components/today/styles'
import { loadTweaks } from '~/components/today/tweaks'

export const Route = createFileRoute('/_authenticated/groups')({
  component: GroupsPage,
})

const GROUP_COLOR_TOKENS = [
  'indigo',
  'violet',
  'emerald',
  'amber',
  'rose',
  'slate',
] as const
type GroupColorToken = (typeof GROUP_COLOR_TOKENS)[number]
const GROUP_COLOR_HEX: Record<GroupColorToken, string> = {
  indigo: '#5b6cf5',
  violet: '#8b5cf6',
  emerald: '#10b981',
  amber: '#f59e0b',
  rose: '#f43f5e',
  slate: '#64748b',
}
function colorForGroup(color: string | undefined): string {
  if (!color) return GROUP_COLOR_HEX.indigo
  if ((GROUP_COLOR_TOKENS as readonly string[]).includes(color)) {
    return GROUP_COLOR_HEX[color as GroupColorToken]
  }
  return color
}

const INPUT_CLASSES = cn(
  'border-input bg-background flex h-9 min-w-0 flex-1 rounded-lg border px-3 text-sm shadow-xs outline-none',
  'placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
)
const TEXTAREA_CLASSES = cn(
  'border-input bg-background flex min-h-[80px] w-full rounded-lg border px-3 py-2 text-sm shadow-xs outline-none',
  'placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
)

function GroupsPage() {
  const [tweaks] = useState(() => loadTweaks())

  // Portaled menus (the nav's avatar dropdown) live outside .today-root and
  // follow the shadcn dark class, so keep it in sync on direct landings.
  useEffect(() => {
    const root = document.documentElement
    if (tweaks.theme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
  }, [tweaks.theme])

  return (
    <div
      className="today-root"
      data-today-theme={tweaks.theme}
      style={{ ['--t-accent-raw' as never]: tweaks.accent }}
    >
      <style>{todayStyles}</style>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap"
      />

      <div className="t-main">
        <Nav active="groups" />

        <Authenticated>
          <GroupsList />
        </Authenticated>
      </div>
    </div>
  )
}

function GroupsList() {
  const groups = useQuery(api.groups.list, {})
  const [createOpen, setCreateOpen] = useState(false)

  return (
    <div className="pb-16">
      <div className="t-page-head mb-6">
        <h1>Groups</h1>
        {groups !== undefined && (
          <span className="t-page-head__count">
            {groups.length} group{groups.length === 1 ? '' : 's'}
          </span>
        )}
        <span style={{ flex: 1 }} />
        <button
          type="button"
          className="t-btn-create"
          onClick={() => setCreateOpen(true)}
        >
          <span style={{ fontSize: 18, lineHeight: 1, marginTop: -2 }}>＋</span>
          New group
        </button>
      </div>

      {groups === undefined ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-xl border bg-muted/40"
            />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <EmptyState onCreate={() => setCreateOpen(true)} />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[...groups]
            .sort((a, b) => a.position - b.position)
            .map((g) => (
              <GroupCard key={g._id} group={g} />
            ))}
        </div>
      )}

      <NewGroupModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  )
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="rounded-xl border border-dashed p-12 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-2xl">
        ✦
      </div>
      <h2 className="mb-1 text-base font-semibold">No groups yet</h2>
      <p className="mx-auto mb-4 max-w-sm text-sm text-muted-foreground">
        Groups bundle related tasks — like Personal, Launch, or Bug bash. Create
        one and start filing tasks into it.
      </p>
      <Button onClick={onCreate}>Create your first group</Button>
    </div>
  )
}

function GroupIcon({
  group,
  size = 40,
}: {
  group: Pick<Doc<'taskGroups'>, 'iconImageUrl' | 'icon' | 'color' | 'name'>
  size?: number
}) {
  const dim = `${size}px`
  if (group.iconImageUrl) {
    return (
      <img
        src={group.iconImageUrl}
        alt=""
        className="rounded-lg object-cover"
        style={{ width: dim, height: dim }}
      />
    )
  }
  if (group.icon) {
    return (
      <div
        className="flex items-center justify-center rounded-lg"
        style={{
          width: dim,
          height: dim,
          background: `${colorForGroup(group.color)}1a`,
          fontSize: size * 0.55,
        }}
      >
        {group.icon}
      </div>
    )
  }
  return (
    <div
      className="flex items-center justify-center rounded-lg font-semibold text-white"
      style={{
        width: dim,
        height: dim,
        background: colorForGroup(group.color),
        fontSize: size * 0.4,
      }}
    >
      {group.name.slice(0, 1).toUpperCase()}
    </div>
  )
}

function GroupCard({ group }: { group: Doc<'taskGroups'> }) {
  const tasks = useQuery(api.tasks.list, { groupId: group._id })
  const openCount =
    tasks?.filter((t) => t.status === 'open' || t.status === 'in_progress').length ??
    null

  return (
    <Link
      to="/groups/$groupId"
      params={{ groupId: group._id }}
      className="group flex h-full flex-col gap-3 rounded-xl border bg-card p-4 transition hover:border-ring hover:shadow-sm"
    >
      <div className="flex items-start gap-3">
        <GroupIcon group={group} />
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold leading-tight">{group.name}</div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            {openCount === null ? '…' : `${openCount} open`}
          </div>
        </div>
      </div>
      {group.description ? (
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {group.description}
        </p>
      ) : (
        <p className="text-sm italic text-muted-foreground/60">No description</p>
      )}
    </Link>
  )
}

function NewGroupModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const navigate = useNavigate()
  const createGroup = useMutation(api.groups.create)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState('')
  const [color, setColor] = useState<GroupColorToken>('indigo')
  const [iconImageUrl, setIconImageUrl] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const nameRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (open) {
      setName('')
      setDescription('')
      setIcon('')
      setColor('indigo')
      setIconImageUrl(null)
      setSubmitting(false)
      setError(null)
      window.requestAnimationFrame(() => nameRef.current?.focus())
    }
  }, [open])

  if (!open) return null

  async function handleSubmit(e?: FormEvent) {
    e?.preventDefault()
    const trimmed = name.trim()
    if (!trimmed || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const id = await createGroup({
        name: trimmed,
        description: description.trim() || undefined,
        color,
        icon: icon.trim() || undefined,
        iconImageUrl,
      })
      onClose()
      navigate({ to: '/groups/$groupId', params: { groupId: id } })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create group')
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-[10vh]"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose()
      }}
    >
      <form
        className="w-full max-w-lg rounded-2xl border bg-background p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <h2 className="mb-4 text-lg font-semibold tracking-tight">New group</h2>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Name
            </label>
            <input
              ref={nameRef}
              className={INPUT_CLASSES}
              value={name}
              disabled={submitting}
              onChange={(e) => setName(e.target.value)}
              placeholder="Personal, Launch, Bug bash…"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Description
            </label>
            <textarea
              className={TEXTAREA_CLASSES}
              value={description}
              disabled={submitting}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this group for? (optional)"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Icon image
            </label>
            {iconImageUrl ? (
              <div className="flex items-center gap-3 rounded-lg border p-3">
                <img
                  src={iconImageUrl}
                  alt=""
                  className="h-12 w-12 rounded-md object-cover"
                />
                <div className="flex-1 truncate text-xs text-muted-foreground">
                  Uploaded
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIconImageUrl(null)}
                >
                  Remove
                </Button>
              </div>
            ) : (
              <UploadDropzone
                endpoint="groupIcon"
                appearance={{
                  container:
                    'border border-input rounded-lg p-4 ut-allowed-content:text-xs ut-label:text-sm',
                }}
                onClientUploadComplete={(res) => {
                  const url = res[0]?.serverData?.url ?? res[0]?.ufsUrl
                  if (url) setIconImageUrl(url)
                }}
                onUploadError={(e) => setError(e.message)}
              />
            )}
          </div>

          <div className="grid grid-cols-[80px_1fr] gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Emoji
              </label>
              <input
                className={cn(INPUT_CLASSES, 'text-center')}
                value={icon}
                disabled={submitting || iconImageUrl !== null}
                maxLength={2}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="🚀"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Color
              </label>
              <div className="flex h-9 items-center gap-2">
                {GROUP_COLOR_TOKENS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    aria-label={c}
                    className={cn(
                      'h-7 w-7 rounded-full transition',
                      color === c
                        ? 'ring-2 ring-ring ring-offset-2 ring-offset-background'
                        : 'opacity-70 hover:opacity-100',
                    )}
                    style={{ background: GROUP_COLOR_HEX[c] }}
                  />
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={submitting || name.trim() === ''}>
            {submitting ? 'Creating…' : 'Create group'}
          </Button>
        </div>
      </form>
    </div>
  )
}
