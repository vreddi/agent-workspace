import { createFileRoute } from '@tanstack/react-router'
import { Authenticated } from 'convex/react'
import { TodayDashboard } from '~/components/today/dashboard'

export const Route = createFileRoute('/_authenticated/today')({
  component: TodayRoute,
})

function TodayRoute() {
  return (
    <Authenticated>
      <TodayDashboard />
    </Authenticated>
  )
}
