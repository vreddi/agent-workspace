import { useEffect, useState, type ReactNode } from 'react'
import { Nav, type NavPage } from './nav'
import { todayStyles } from './styles'
import { loadTweaks } from './tweaks'

/**
 * Themed page shell for logged-in pages that don't roll their own root:
 * soft-white `.today-root` surface, the shared top nav, and the centered
 * `t-main` column. Keeps navigation identical on every page — same links,
 * same order, same place.
 */
export function AppShell({
  active,
  children,
}: {
  active?: NavPage
  children: ReactNode
}) {
  const [tweaks] = useState(() => loadTweaks())

  // Portaled menus (dropdowns, selects) live outside .today-root and follow
  // the shadcn dark class, so keep it in sync when landing here directly.
  useEffect(() => {
    const root = document.documentElement
    if (tweaks.theme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
  }, [tweaks.theme])

  return (
    <div
      className="today-root"
      data-today-theme={tweaks.theme}
      style={{ ['--t-accent-raw' as never]: tweaks.accent }}
    >
      <style>{todayStyles}</style>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap"
      />
      <div className="t-main">
        <Nav active={active} />
        {children}
      </div>
    </div>
  )
}
