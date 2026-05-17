import { api } from '@convex/_generated/api'
import { UserButton, useUser } from '@clerk/tanstack-react-start'
import { Button } from '@org/ui/components/button'
import { cn } from '@org/ui/lib/utils'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Authenticated, useMutation, useQuery } from 'convex/react'
import { useState, type FormEvent } from 'react'

export const Route = createFileRoute('/_authenticated/todos')({
  component: TodosPage,
})

function TodosPage() {
  const { user } = useUser()

  return (
    <main className="mx-auto max-w-lg p-8">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Todos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {user?.primaryEmailAddress?.emailAddress ?? user?.id}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/">Home</Link>
          </Button>
          <UserButton />
        </div>
      </header>

      <Authenticated>
        <TodoList />
      </Authenticated>
    </main>
  )
}

function TodoList() {
  const todos = useQuery(api.todos.list)
  const createTodo = useMutation(api.todos.create)
  const toggleTodo = useMutation(api.todos.toggle)
  const removeTodo = useMutation(api.todos.remove)
  const [title, setTitle] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return
    await createTodo({ title: trimmed })
    setTitle('')
  }

  if (todos === undefined) {
    return <p className="text-sm text-muted-foreground">Loading todos…</p>
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs to be done?"
          className={cn(
            'border-input bg-background flex h-9 min-w-0 flex-1 rounded-lg border px-3 text-sm shadow-xs outline-none',
            'placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
          )}
        />
        <Button type="submit">Add</Button>
      </form>

      {todos.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No todos yet. Add one above.
        </p>
      ) : (
        <ul className="space-y-2">
          {todos.map((todo) => (
            <li
              key={todo._id}
              className="border-border flex items-center gap-3 rounded-lg border px-3 py-2"
            >
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => toggleTodo({ id: todo._id })}
                className="border-input size-4 rounded border"
                aria-label={`Mark "${todo.title}" as ${todo.completed ? 'incomplete' : 'complete'}`}
              />
              <span
                className={cn(
                  'min-w-0 flex-1 text-sm',
                  todo.completed && 'text-muted-foreground line-through',
                )}
              >
                {todo.title}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-destructive h-8 px-2"
                onClick={() => removeTodo({ id: todo._id })}
              >
                Delete
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
