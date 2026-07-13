import { auth } from '@clerk/tanstack-react-start/server'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { Landing } from '~/components/landing/landing'
import { FAQ_ITEMS } from '~/components/landing/sections'

// The root path is the public landing page; signed-in visitors are sent
// straight to their home (`/app`). Clerk's `auth()` is best-effort here: if
// it fails (misconfig, Clerk API hiccup) we still render the public landing
// rather than 500 the whole page — mirrors `fetchClerkAuth` in `__root.tsx`.
// The `redirect` throw stays outside the try so it isn't swallowed as an error.
const redirectIfSignedIn = createServerFn({ method: 'GET' }).handler(
  async () => {
    let isAuthenticated = false
    try {
      ;({ isAuthenticated } = await auth())
    } catch (err) {
      console.error('[clerk] redirectIfSignedIn auth() failed:', err)
      return
    }
    if (isAuthenticated) {
      throw redirect({ to: '/app' })
    }
  },
)

const TITLE = 'Today: a calm task manager with a tiny AI village'
const DESCRIPTION =
  'Today is a neurodivergent-first to-do app. Capture tasks, plan one clear day, track goals and metrics, and let AI helpers in a cozy pixel village keep you gently accountable.'

const structuredData = JSON.stringify({
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      name: 'Today',
      applicationCategory: 'Productivity',
      operatingSystem: 'Web, iOS, Android',
      description: DESCRIPTION,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    },
    {
      '@type': 'FAQPage',
      mainEntity: FAQ_ITEMS.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      })),
    },
  ],
})

export const Route = createFileRoute('/')({
  beforeLoad: async () => redirectIfSignedIn(),
  head: () => ({
    meta: [
      { title: TITLE },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1, viewport-fit=cover',
      },
      { name: 'description', content: DESCRIPTION },
      { property: 'og:title', content: TITLE },
      { property: 'og:description', content: DESCRIPTION },
      { property: 'og:type', content: 'website' },
      { property: 'og:image', content: '/goal-types/adventure.png' },
      { name: 'twitter:card', content: 'summary' },
      { name: 'twitter:title', content: TITLE },
      { name: 'twitter:description', content: DESCRIPTION },
    ],
    scripts: [{ type: 'application/ld+json', children: structuredData }],
  }),
  component: Home,
})

function Home() {
  return <Landing />
}
