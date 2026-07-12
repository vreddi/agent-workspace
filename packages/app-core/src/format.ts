// Generic formatting and hashing utilities. Deterministic and pure.

/** FNV-1a hash. Deterministic across platforms — the basis for stable,
 * content-derived choices (tones, sources) that must agree everywhere. */
export function hashString(value: string): number {
  let h = 2166136261
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h)
}

/** Deterministically pick an element of `arr` keyed by `key`. */
export function pick<T>(arr: ReadonlyArray<T>, key: string, salt = 0): T {
  return arr[(hashString(key) + salt) % arr.length]!
}

/** Compact deadline badge, e.g. "07/04  9:30 AM". */
export function fmtDateBadge(d: Date | null): string {
  if (!d) return '—'
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  let hh = d.getHours()
  const min = String(d.getMinutes()).padStart(2, '0')
  const ampm = hh >= 12 ? 'PM' : 'AM'
  hh = hh % 12 || 12
  return `${mm}/${dd}  ${hh}:${min} ${ampm}`
}

/** Round to one decimal place and stringify, e.g. 2.25 -> "2.3". */
export function formatDays(n: number): string {
  const rounded = Math.round(n * 10) / 10
  return `${rounded}`
}

/** Human-friendly effort cost from a fractional day count (1 day = 24h).
 * Sub-hour reads in minutes ("30m"), under a day in hours ("2h", "2h 30m"),
 * and a day or more in days rounded to one decimal ("1.5d"). */
export function formatCostDuration(days: number): string {
  const totalMinutes = Math.round(days * 24 * 60)
  if (totalMinutes < 60) return `${totalMinutes}m`
  if (totalMinutes < 24 * 60) {
    const h = Math.floor(totalMinutes / 60)
    const m = totalMinutes % 60
    return m ? `${h}h ${m}m` : `${h}h`
  }
  return `${formatDays(days)}d`
}
