import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import type { TaskAssignee } from '@convex/tasks'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@org/ui/components/popover'
import { useMutation, useQuery } from 'convex/react'
import { useDeferredValue, useState, type CSSProperties } from 'react'
import {
  initialsFromName,
  TONE_STYLES,
  toneFor,
} from '~/components/today/helpers'

// Styled inline (not via the tdp stylesheet) so avatars render the same on
// any page that shows tasks, not just the detail page.
function avatarBaseStyle(size: number): CSSProperties {
  return {
    width: size,
    height: size,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    flexShrink: 0,
    overflow: 'hidden',
    fontWeight: 800,
    letterSpacing: '0.02em',
    userSelect: 'none',
    boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.08)',
  }
}

export function AssigneeAvatar({
  userId,
  name,
  imageUrl,
  size = 26,
}: {
  userId: string
  name: string
  imageUrl: string | null
  size?: number
}) {
  const tone = TONE_STYLES[toneFor(userId)]
  return (
    <span
      style={{
        ...avatarBaseStyle(size),
        fontSize: Math.round(size * 0.4),
        background: imageUrl ? undefined : tone.bg,
        color: tone.fg,
      }}
      title={name}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        initialsFromName(name, '?')
      )}
    </span>
  )
}

// Overlapping avatar row for task lists. Solo self-assigned tasks stay
// visually quiet — render this only when a task is genuinely shared.
export function AssigneeStack({
  assignees,
  max = 3,
  size = 22,
}: {
  assignees: TaskAssignee[]
  max?: number
  size?: number
}) {
  const shown = assignees.slice(0, max)
  const extra = assignees.length - shown.length
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center' }}>
      {shown.map((a, index) => (
        <span
          key={a.userId}
          style={{
            marginLeft: index === 0 ? 0 : -7,
            borderRadius: '50%',
            boxShadow: '0 0 0 2px var(--t-bg, #fff)',
            display: 'inline-flex',
          }}
        >
          <AssigneeAvatar
            userId={a.userId}
            name={a.name || a.email}
            imageUrl={a.imageUrl}
            size={size}
          />
        </span>
      ))}
      {extra > 0 && (
        <span
          style={{
            ...avatarBaseStyle(size),
            marginLeft: -7,
            fontSize: Math.round(size * 0.38),
            background: 'var(--t-chip-bg, #eee)',
            color: 'var(--t-ink-2, #555)',
            boxShadow: '0 0 0 2px var(--t-bg, #fff)',
          }}
        >
          +{extra}
        </span>
      )}
    </span>
  )
}

// "People" section of the task detail page: who's on the task, plus an
// open search across all accounts to share or hand the task off.
export function TaskPeopleSection({
  taskId,
  assignees,
  creatorId,
  viewerId,
}: {
  taskId: Id<'tasks'>
  assignees: TaskAssignee[]
  creatorId: Id<'users'>
  viewerId: Id<'users'>
}) {
  const setAssignees = useMutation(api.taskAssignments.setAssignees)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save(nextIds: Id<'users'>[]) {
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      await setAssignees({ taskId, assigneeIds: nextIds })
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to update assignees',
      )
    } finally {
      setBusy(false)
    }
  }

  const assigneeIds = assignees.map((a) => a.userId)

  return (
    <section className="tdp-section">
      <div className="tdp-section__head">
        <h2>People</h2>
        <span className="tdp-section__count">{assignees.length}</span>
      </div>
      <ul className="tdp-people">
        {assignees.map((person) => {
          const isYou = person.userId === viewerId
          const isCreator = person.userId === creatorId
          const displayName = person.name.trim() || person.email
          return (
            <li key={person.userId} className="tdp-people__row">
              <AssigneeAvatar
                userId={person.userId}
                name={displayName}
                imageUrl={person.imageUrl}
                size={30}
              />
              <span className="tdp-people__text">
                <span className="tdp-people__name">
                  {displayName}
                  {isYou && <span className="tdp-people__you"> (you)</span>}
                </span>
                <span className="tdp-people__email">{person.email}</span>
              </span>
              {isCreator && <span className="tdp-people__tag">Creator</span>}
              {assignees.length > 1 && (
                <button
                  type="button"
                  className="tdp-people__remove"
                  disabled={busy}
                  aria-label={
                    isYou ? 'Leave this task' : `Remove ${displayName}`
                  }
                  title={isYou ? 'Leave this task' : `Remove ${displayName}`}
                  onClick={() => {
                    void save(assigneeIds.filter((id) => id !== person.userId))
                  }}
                >
                  ×
                </button>
              )}
            </li>
          )
        })}
      </ul>
      <AddPersonButton
        busy={busy}
        excludeIds={assigneeIds}
        onAdd={(userId) => {
          void save([...assigneeIds, userId])
        }}
      />
      {error && <p className="tdp-form__error">{error}</p>}
    </section>
  )
}

function AddPersonButton({
  busy,
  excludeIds,
  onAdd,
}: {
  busy: boolean
  excludeIds: Id<'users'>[]
  onAdd: (userId: Id<'users'>) => void
}) {
  const [open, setOpen] = useState(false)
  const [term, setTerm] = useState('')
  const deferredTerm = useDeferredValue(term)
  const results = useQuery(
    api.users.search,
    deferredTerm.trim() === '' ? 'skip' : { query: deferredTerm },
  )

  const candidates = (results ?? []).filter(
    (user) => !excludeIds.includes(user.userId),
  )

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setTerm('')
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          className="tdp-btn tdp-people__add"
          disabled={busy}
        >
          + Add person
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-2">
        <input
          className="tdp-input tdp-people__search"
          value={term}
          autoFocus
          placeholder="Search anyone by name or email…"
          onChange={(e) => setTerm(e.target.value)}
        />
        <ul className="tdp-people__results">
          {term.trim() === '' ? (
            <li className="tdp-people__hint">
              Anyone with an account can be assigned.
            </li>
          ) : results === undefined ? (
            <li className="tdp-people__hint">Searching…</li>
          ) : candidates.length === 0 ? (
            <li className="tdp-people__hint">No one found for “{term}”.</li>
          ) : (
            candidates.map((user) => {
              const displayName = user.name.trim() || user.email
              return (
                <li key={user.userId}>
                  <button
                    type="button"
                    className="tdp-people__result"
                    onClick={() => {
                      onAdd(user.userId)
                      setOpen(false)
                      setTerm('')
                    }}
                  >
                    <AssigneeAvatar
                      userId={user.userId}
                      name={displayName}
                      imageUrl={user.imageUrl}
                      size={26}
                    />
                    <span className="tdp-people__text">
                      <span className="tdp-people__name">
                        {displayName}
                        {user.isYou && (
                          <span className="tdp-people__you"> (you)</span>
                        )}
                      </span>
                      <span className="tdp-people__email">{user.email}</span>
                    </span>
                  </button>
                </li>
              )
            })
          )}
        </ul>
      </PopoverContent>
    </Popover>
  )
}
