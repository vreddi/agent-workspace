import { createFileRoute } from '@tanstack/react-router'
import { Authenticated } from 'convex/react'
import { AgentsPage } from '~/components/agents/agents-page'

export const Route = createFileRoute('/_authenticated/agents')({
  component: AgentsRoute,
})

function AgentsRoute() {
  return (
    <Authenticated>
      <AgentsPage />
    </Authenticated>
  )
}
