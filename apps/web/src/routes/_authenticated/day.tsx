import { createFileRoute } from '@tanstack/react-router'
import { DayGraph } from '../../components/day-view/day-graph'

export const Route = createFileRoute('/_authenticated/day')({
  component: DayRoute,
})

function DayRoute() {
  return <DayGraph />
}
