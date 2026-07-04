import { createFileRoute } from '@tanstack/react-router'
import { Authenticated } from 'convex/react'
import { TodayDashboard } from '~/components/today/dashboard'

export const Route = createFileRoute('/_authenticated/today')({
  // `?capture=1` opens the quick-capture palette on arrival — the shared
  // nav's "New task" button uses it from pages without a local palette.
  validateSearch: (search: Record<string, unknown>): { capture?: boolean } =>
    search.capture ? { capture: true } : {},
  component: TodayRoute,
})

function TodayRoute() {
  return (
    <Authenticated>
      <TodayDashboard />
    </Authenticated>
  )
}
