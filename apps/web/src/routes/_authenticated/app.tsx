import { createFileRoute } from '@tanstack/react-router'
import { Authenticated } from 'convex/react'
import { TodayDashboard } from '~/components/today/dashboard'

export const Route = createFileRoute('/_authenticated/app')({
  component: AppRoute,
})

function AppRoute() {
  return (
    <Authenticated>
      <TodayDashboard />
    </Authenticated>
  )
}
