import { api } from '@convex/_generated/api'
import type { Doc } from '@convex/_generated/dataModel'
import { UserButton } from '@clerk/tanstack-react-start'
import { Button } from '@org/ui/components/button'
import { cn } from '@org/ui/lib/utils'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Authenticated, useMutation, useQuery } from 'convex/react'
import { useState } from 'react'
import {
  GoalTypeIcon,
  GOAL_TYPE_COLOR_TOKENS,
  goalTypeColorClasses,
  INPUT_CLASSES,
  TEXTAREA_CLASSES,
  type GoalTypeColorToken,
} from '~/components/goals/goal-ui'

export const Route = createFileRoute('/_authenticated/goals/types')({
  component: GoalTypesPage,
})

function GoalTypesPage() {
  return (
    <main className="mx-auto max-w-3xl p-8">
      <header className="mb-6 flex items-start justify-between gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link to="/goals">← Goals</Link>
        </Button>
        <UserButton />
      </header>

      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Goal types</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Categories you can tag goals with. Built-in types are always
          available; create your own for anything else.
        </p>
      </div>

      <Authenticated>
        <TypesManager />
      </Authenticated>
    </main>
  )
}

function TypesManager() {
  const types = useQuery(api.goalTypes.list, {})
  const [error, setError] = useState<string | null>(null)

  if (types === undefined) {
    return (
      <div className="space-y-2.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-[76px] animate-pulse rounded-xl bg-muted/40" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-10">
      <section>
        <SectionHeading
          title="Built-in"
          count={types.system.length}
          hint="Ready to use and can't be edited."
        />
        <ul className="space-y-2.5">
          {types.system.map((type) => (
            <li
              key={type.slug}
              className="flex items-center gap-4 rounded-xl border bg-card px-4 py-3.5"
            >
              <GoalTypeIcon
                name={type.name}
                color={type.color}
                icon={type.icon}
                image={type.image}
                size={52}
              />
              <div className="min-w-0 flex-1">
                <div className="font-medium leading-tight">{type.name}</div>
                <p className="mt-0.5 truncate text-sm text-muted-foreground">
                  {type.description}
                </p>
              </div>
              <span className="shrink-0 rounded-full border bg-muted/40 px-2.5 py-0.5 text-xs text-muted-foreground">
                Built-in
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <SectionHeading
          title="Your types"
          count={types.custom.length}
          hint="Types in use by a goal can't be deleted."
        />
        <CustomTypesEditor custom={types.custom} onError={setError} />
        {error && (
          <div className="mt-3 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </div>
        )}
      </section>
    </div>
  )
}

function SectionHeading({
  title,
  count,
  hint,
}: {
  title: string
  count: number
  hint: string
}) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3">
      <h2 className="text-sm font-semibold tracking-tight">
        {title}
        <span className="ml-1.5 font-normal text-muted-foreground">{count}</span>
      </h2>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  )
}

function CustomTypesEditor({
  custom,
  onError,
}: {
  custom: Doc<'goalTypes'>[]
  onError: (message: string | null) => void
}) {
  const createType = useMutation(api.goalTypes.create)
  const [creating, setCreating] = useState(false)

  return (
    <div className="space-y-2.5">
      {custom.map((type) => (
        <CustomTypeRow key={type._id} type={type} onError={onError} />
      ))}

      {creating ? (
        <TypeForm
          submitLabel="Create type"
          onCancel={() => setCreating(false)}
          onSubmit={async ({ name, description, color }) => {
            onError(null)
            await createType({ name, description, color })
            setCreating(false)
          }}
        />
      ) : (
        <button
          type="button"
          onClick={() => {
            onError(null)
            setCreating(true)
          }}
          className={cn(
            'flex w-full items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-3.5',
            'text-sm text-muted-foreground transition hover:border-ring hover:text-foreground',
          )}
        >
          + New type
        </button>
      )}
    </div>
  )
}

function CustomTypeRow({
  type,
  onError,
}: {
  type: Doc<'goalTypes'>
  onError: (message: string | null) => void
}) {
  const updateType = useMutation(api.goalTypes.update)
  const removeType = useMutation(api.goalTypes.remove)
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)

  if (editing) {
    return (
      <TypeForm
        submitLabel="Save"
        initial={{
          name: type.name,
          description: type.description ?? '',
          color: normalizeColor(type.color),
        }}
        onCancel={() => setEditing(false)}
        onSubmit={async ({ name, description, color }) => {
          onError(null)
          await updateType({
            id: type._id,
            name,
            description: description === '' ? null : description,
            color,
          })
          setEditing(false)
        }}
      />
    )
  }

  async function handleDelete() {
    if (busy) return
    setBusy(true)
    onError(null)
    try {
      await removeType({ id: type._id })
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to delete type')
      setBusy(false)
    }
  }

  return (
    <div className="flex items-center gap-4 rounded-xl border bg-card px-4 py-3.5">
      <GoalTypeIcon
        name={type.name}
        color={type.color}
        icon={type.icon}
        size={52}
      />
      <div className="min-w-0 flex-1">
        <div className="font-medium leading-tight">{type.name}</div>
        <p className="mt-0.5 truncate text-sm text-muted-foreground">
          {type.description ? type.description : 'No description'}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() => {
            onError(null)
            setEditing(true)
          }}
        >
          Edit
        </Button>
        <Button
          size="sm"
          variant="destructive"
          disabled={busy}
          onClick={() => {
            void handleDelete()
          }}
        >
          Delete
        </Button>
      </div>
    </div>
  )
}

type TypeFormValues = {
  name: string
  description: string
  color: GoalTypeColorToken
}

function TypeForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial?: TypeFormValues
  submitLabel: string
  onSubmit: (values: TypeFormValues) => Promise<void>
  onCancel: () => void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [color, setColor] = useState<GoalTypeColorToken>(
    initial?.color ?? 'emerald',
  )
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    const trimmed = name.trim()
    if (!trimmed || busy) return
    setBusy(true)
    setError(null)
    try {
      await onSubmit({ name: trimmed, description: description.trim(), color })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save type')
      setBusy(false)
    }
  }

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-start gap-4">
        <GoalTypeIcon name={name || '?'} color={color} size={52} />
        <div className="min-w-0 flex-1 space-y-2.5">
          <input
            autoFocus
            className={INPUT_CLASSES}
            value={name}
            disabled={busy}
            onChange={(e) => setName(e.target.value)}
            placeholder="Type name (e.g. Side projects)"
          />
          <textarea
            className={cn(TEXTAREA_CLASSES, 'min-h-[56px]')}
            value={description}
            disabled={busy}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What kind of goals belong here? (optional)"
          />
          <div className="flex flex-wrap items-center gap-2">
            {GOAL_TYPE_COLOR_TOKENS.map((token) => (
              <button
                key={token}
                type="button"
                aria-label={token}
                disabled={busy}
                onClick={() => setColor(token)}
                className={cn(
                  'h-6 w-6 rounded-full transition',
                  goalTypeColorClasses(token).swatch,
                  color === token
                    ? 'ring-2 ring-ring ring-offset-2 ring-offset-background'
                    : 'opacity-70 hover:opacity-100',
                )}
              />
            ))}
          </div>
        </div>
      </div>

      {error && <p className="mt-3 text-xs text-destructive">{error}</p>}

      <div className="mt-4 flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={busy || name.trim() === ''}
          onClick={() => {
            void handleSubmit()
          }}
        >
          {busy ? 'Saving…' : submitLabel}
        </Button>
      </div>
    </div>
  )
}

// Custom types created before the palette was fixed may hold a color outside
// the token set; fall back to a valid swatch so the picker has a selection.
function normalizeColor(color: string): GoalTypeColorToken {
  return (GOAL_TYPE_COLOR_TOKENS as readonly string[]).includes(color)
    ? (color as GoalTypeColorToken)
    : 'slate'
}
