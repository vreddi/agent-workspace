import { useEffect, useMemo, useRef, useState } from 'react'
import emojiGroupsData from 'unicode-emoji-json/data-by-group.json'

type EmojiEntry = {
  emoji: string
  name: string
  slug: string
}
type EmojiGroup = {
  name: string
  slug: string
  emojis: EmojiEntry[]
}

const GROUPS = emojiGroupsData as unknown as EmojiGroup[]
const ALL_EMOJIS: EmojiEntry[] = GROUPS.flatMap((g) => g.emojis)

/** Short label + representative glyph for each category tab (iOS-style). */
const CATEGORY_META: Record<string, { label: string; icon: string }> = {
  smileys_emotion: { label: 'Smileys & Emotion', icon: '😀' },
  people_body: { label: 'People & Body', icon: '👋' },
  animals_nature: { label: 'Animals & Nature', icon: '🐻' },
  food_drink: { label: 'Food & Drink', icon: '🍔' },
  travel_places: { label: 'Travel & Places', icon: '✈️' },
  activities: { label: 'Activities', icon: '⚽' },
  objects: { label: 'Objects', icon: '💡' },
  symbols: { label: 'Symbols', icon: '❤️' },
  flags: { label: 'Flags', icon: '🏁' },
}

function labelFor(group: EmojiGroup) {
  return CATEGORY_META[group.slug]?.label ?? group.name
}

/**
 * Full iOS-style emoji picker: search box, category tabs that jump to
 * sections, and every Unicode emoji grouped by category. Emoji render with
 * the system font — no image assets or network fetches.
 */
function EmojiPicker({
  onSelect,
  onClear,
  hasValue,
}: {
  onSelect: (emoji: string) => void
  onClear: () => void
  hasValue: boolean
}) {
  const [query, setQuery] = useState('')
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const searchRef = useRef<HTMLInputElement | null>(null)
  const [activeSlug, setActiveSlug] = useState(GROUPS[0].slug)

  useEffect(() => {
    window.requestAnimationFrame(() => searchRef.current?.focus())
  }, [])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return null
    const terms = q.split(/\s+/)
    return ALL_EMOJIS.filter((e) =>
      terms.every((t) => e.name.includes(t) || e.slug.includes(t)),
    )
  }, [query])

  function jumpTo(slug: string) {
    setActiveSlug(slug)
    const el = sectionRefs.current[slug]
    const scroller = scrollRef.current
    if (el && scroller) scroller.scrollTop = el.offsetTop
  }

  function handleScroll() {
    const scroller = scrollRef.current
    if (!scroller) return
    const top = scroller.scrollTop + 4
    let current = GROUPS[0].slug
    for (const g of GROUPS) {
      const el = sectionRefs.current[g.slug]
      if (el && el.offsetTop <= top) current = g.slug
    }
    setActiveSlug(current)
  }

  return (
    <div className="t-emoji__panel" role="dialog" aria-label="Pick an emoji">
      <div className="t-emoji__search">
        <svg
          className="t-emoji__search-icon"
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
        <input
          ref={searchRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search emoji"
          aria-label="Search emoji"
        />
        {query && (
          <button
            type="button"
            className="t-emoji__search-clear"
            onClick={() => setQuery('')}
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </div>

      {!results && (
        <div className="t-emoji__tabs">
          {GROUPS.map((g) => (
            <button
              key={g.slug}
              type="button"
              className="t-emoji__tab"
              data-active={activeSlug === g.slug ? true : undefined}
              title={labelFor(g)}
              aria-label={labelFor(g)}
              onClick={() => jumpTo(g.slug)}
            >
              {CATEGORY_META[g.slug]?.icon ?? g.emojis[0].emoji}
            </button>
          ))}
        </div>
      )}

      <div
        className="t-emoji__scroll"
        ref={scrollRef}
        onScroll={results ? undefined : handleScroll}
      >
        {results ? (
          results.length === 0 ? (
            <div className="t-emoji__empty">No emoji found.</div>
          ) : (
            <div className="t-emoji__grid">
              {results.map((e) => (
                <button
                  key={e.slug}
                  type="button"
                  className="t-emoji__cell"
                  title={e.name}
                  aria-label={e.name}
                  onClick={() => onSelect(e.emoji)}
                >
                  {e.emoji}
                </button>
              ))}
            </div>
          )
        ) : (
          GROUPS.map((g) => (
            <div
              key={g.slug}
              className="t-emoji__section"
              ref={(el) => {
                sectionRefs.current[g.slug] = el
              }}
            >
              <div className="t-emoji__section-head">{labelFor(g)}</div>
              <div className="t-emoji__grid">
                {g.emojis.map((e) => (
                  <button
                    key={e.slug}
                    type="button"
                    className="t-emoji__cell"
                    title={e.name}
                    aria-label={e.name}
                    onClick={() => onSelect(e.emoji)}
                  >
                    {e.emoji}
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {hasValue && (
        <button type="button" className="t-emoji__clear" onClick={onClear}>
          Remove emoji
        </button>
      )}
    </div>
  )
}

/** The task glyph button in the capture row; opens the emoji picker. */
export function EmojiGlyphButton({
  value,
  disabled,
  onSelect,
}: {
  value: string | null
  disabled: boolean
  onSelect: (emoji: string | null) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])
  return (
    <div className="t-emoji" ref={ref}>
      <button
        type="button"
        className="t-emoji__trigger"
        data-has-emoji={value ? true : undefined}
        disabled={disabled}
        aria-label={value ? 'Change task emoji' : 'Add a task emoji'}
        onClick={() => setOpen((o) => !o)}
      >
        {value ? (
          <span className="t-emoji__glyph">{value}</span>
        ) : (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M8 14s1.5 2 4 2 4-2 4-2" />
            <line x1="9" y1="9" x2="9.01" y2="9" />
            <line x1="15" y1="9" x2="15.01" y2="9" />
          </svg>
        )}
      </button>
      {open && (
        <EmojiPicker
          hasValue={!!value}
          onSelect={(emoji) => {
            onSelect(emoji)
            setOpen(false)
          }}
          onClear={() => {
            onSelect(null)
            setOpen(false)
          }}
        />
      )}
    </div>
  )
}
