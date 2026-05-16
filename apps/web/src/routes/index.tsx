import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  return (
    <main>
      <h1>Web</h1>
      <p>TanStack Start app.</p>
    </main>
  )
}
