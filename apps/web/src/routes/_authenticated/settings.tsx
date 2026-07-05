import { createFileRoute } from '@tanstack/react-router'
import { Authenticated } from 'convex/react'
import { SettingsPage } from '~/components/settings/settings-page'

export const Route = createFileRoute('/_authenticated/settings')({
  component: SettingsRoute,
})

function SettingsRoute() {
  return (
    <Authenticated>
      <SettingsPage />
    </Authenticated>
  )
}
