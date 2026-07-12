import { useState, type ReactNode } from 'react'
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

  // Dark mode is applied globally by useTheme() (root) from the saved theme
  // preference — the `.dark` class it toggles drives both shadcn tokens and
  // the `--t-*` surfaces below, so this shell needs no theme wiring of its own.
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
