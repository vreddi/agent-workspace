import type { SourceKind } from './helpers'

type Props = { size?: number }

function GitHubBrand({ size = 16 }: Props) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} aria-hidden="true">
      <path
        fill="#181717"
        d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38v-1.33c-2.22.48-2.69-1.07-2.69-1.07-.36-.93-.89-1.18-.89-1.18-.73-.5.05-.49.05-.49.81.06 1.23.83 1.23.83.72 1.23 1.88.87 2.34.67.07-.52.28-.87.51-1.07-1.77-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.22 2.2.82a7.6 7.6 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.28.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48v2.19c0 .21.15.46.55.38A8 8 0 0 0 16 8c0-4.42-3.58-8-8-8Z"
      />
    </svg>
  )
}

function GmailBrand({ size = 16 }: Props) {
  return (
    <svg viewBox="0 0 16 12" width={size} height={(size * 12) / 16} aria-hidden="true">
      <path fill="#4285F4" d="M.5 11h2.7V4.4L.5 2.4z" />
      <path fill="#34A853" d="M12.8 11h2.7V2.4L12.8 4.4z" />
      <path
        fill="#FBBC04"
        d="M12.8 1.5v3l2.7-2-.4-1.2c-.2-.4-.7-.6-1.1-.4l-1.2.6z"
      />
      <path fill="#EA4335" d="M3.2 4.5v-3L8 7l4.8-5.5v3L8 7.9z" />
      <path fill="#C5221F" d="M.5 2.4 3.2 4.4v-3l-1.2-.6c-.4-.2-.9 0-1.1.4z" />
    </svg>
  )
}

function SlackBrand({ size = 16 }: Props) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} aria-hidden="true">
      <path
        fill="#E01E5A"
        d="M3.4 10.1a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 1.5-1.5h1.5v1.5Zm.8 0a1.5 1.5 0 0 1 3 0v3.7a1.5 1.5 0 0 1-3 0z"
      />
      <path
        fill="#36C5F0"
        d="M5.7 3.4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 1.5 1.5v1.5H5.7Zm0 .8a1.5 1.5 0 0 1 0 3H2a1.5 1.5 0 0 1 0-3z"
      />
      <path
        fill="#2EB67D"
        d="M12.6 5.7a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-1.5 1.5h-1.5V5.7Zm-.8 0a1.5 1.5 0 0 1-3 0V2a1.5 1.5 0 0 1 3 0z"
      />
      <path
        fill="#ECB22E"
        d="M10.3 12.6a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1-1.5-1.5v-1.5h1.5Zm0-.8a1.5 1.5 0 0 1 0-3H14a1.5 1.5 0 0 1 0 3z"
      />
    </svg>
  )
}

function DiscordBrand({ size = 16 }: Props) {
  return (
    <svg viewBox="0 0 16 12" width={size} height={(size * 12) / 16} aria-hidden="true">
      <path
        fill="#5865F2"
        d="M13.5 1.1c-1-.5-2.1-.8-3.2-1l-.2.3a8 8 0 0 0-3-.1c-.1 0-.2-.2-.3-.3-1.2.2-2.3.5-3.3 1A11.4 11.4 0 0 0 .2 8.7a8.2 8.2 0 0 0 2.5 1.3l.5-.8a4.8 4.8 0 0 1-.8-.4l.2-.1a5.7 5.7 0 0 0 5 0l.2.1c-.2.2-.5.3-.8.4l.6.8c.9-.3 1.7-.7 2.5-1.3a11.5 11.5 0 0 0-1.6-7.6Zm-8 6.1a1.4 1.4 0 0 1-1.3-1.4c0-.8.6-1.4 1.3-1.4.7 0 1.3.6 1.3 1.4 0 .8-.6 1.4-1.3 1.4Zm5 0a1.4 1.4 0 0 1-1.3-1.4c0-.8.6-1.4 1.3-1.4.7 0 1.3.6 1.3 1.4 0 .8-.6 1.4-1.3 1.4Z"
      />
    </svg>
  )
}

function MessengerBrand({ size = 16 }: Props) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} aria-hidden="true">
      <defs>
        <linearGradient id="msng" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#00B2FF" />
          <stop offset="50%" stopColor="#006AFF" />
          <stop offset="100%" stopColor="#0084FF" />
        </linearGradient>
      </defs>
      <path
        fill="url(#msng)"
        d="M8 0C3.5 0 0 3.4 0 7.6c0 2.3 1.1 4.3 2.9 5.7v2.5l2.5-1.4c.8.2 1.6.3 2.6.3 4.5 0 8-3.4 8-7.6S12.5 0 8 0Z"
      />
      <path fill="#fff" d="M3.3 9.9 5.7 7.4l1.5 1.5L10.7 7l-2.3 2.5-1.5-1.5z" />
    </svg>
  )
}

function TeamsBrand({ size = 16 }: Props) {
  return (
    <svg viewBox="0 0 16 14" width={size} height={(size * 14) / 16} aria-hidden="true">
      <path
        fill="#5059C9"
        d="M9.5 5c.8 0 1.5-.7 1.5-1.5S10.3 2 9.5 2 8 2.7 8 3.5 8.7 5 9.5 5Zm2 .5h-3l-.7.5h-1c-.4 0-.8.4-.8.9v3.7c0 1.4 1 2.6 2.4 2.9.7 0 1.4-.2 1.9-.5 1-.5 1.5-1.4 1.5-2.4V6.2c0-.3-.2-.7-.6-.7Z"
      />
      <path
        fill="#7B83EB"
        d="M5 4.7c1 0 2-.8 2-2C7 1.8 6 1 5 1S3 1.7 3 2.7c0 1 .9 2 2 2ZM7.3 6h-5c-.7 0-1.3.6-1.3 1.3v3.4c0 1.4 1 2.6 2.4 2.9.6.1 1.1.1 1.7 0a2.95 2.95 0 0 0 2.4-2.9V7.3c.1-.7-.5-1.3-1.2-1.3Z"
      />
    </svg>
  )
}

function FigmaBrand({ size = 16 }: Props) {
  return (
    <svg
      viewBox="0 0 12 16"
      width={(size * 12) / 16}
      height={size}
      aria-hidden="true"
    >
      <path fill="#F24E1E" d="M3 0h3v5H3a2.5 2.5 0 0 1 0-5Z" />
      <path fill="#FF7262" d="M6 0h3a2.5 2.5 0 0 1 0 5H6V0Z" />
      <path fill="#A259FF" d="M6 5h3a2.5 2.5 0 0 1 0 5H6V5Z" />
      <path fill="#1ABCFE" d="M9 13a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z" />
      <path fill="#0ACF83" d="M3 10h3v5H3a2.5 2.5 0 0 1 0-5Z" />
    </svg>
  )
}

function LinearBrand({ size = 16 }: Props) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} aria-hidden="true">
      <defs>
        <linearGradient id="lin" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#5E6AD2" />
          <stop offset="100%" stopColor="#26282D" />
        </linearGradient>
      </defs>
      <path
        fill="url(#lin)"
        d="M1.3 9.4 6.6 14.7C3.7 14 1 11.3.3 8.4l1 1ZM.4 6.3l9.3 9.3c-.5.1-.9.2-1.4.3l-8.2-8.2c.1-.5.2-.9.3-1.4ZM2 3.7l10.3 10.3c-.4.2-.7.4-1.1.6L1.1 4.8c.2-.4.4-.7.6-1.1ZM4.5 1.5C6.5.5 9 .3 11.2 1.1c2.2.9 3.8 2.5 4.7 4.7.8 2.2.6 4.7-.4 6.7L4.5 1.5Z"
      />
    </svg>
  )
}

function NotionBrand({ size = 16 }: Props) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} aria-hidden="true">
      <rect
        x="1"
        y="1"
        width="14"
        height="14"
        rx="2"
        fill="#fff"
        stroke="#191919"
        strokeWidth="1.2"
      />
      <path fill="#191919" d="M5 4.5v7l4.5-6.4v6.4l1.5-.7V4.5H5Z" />
    </svg>
  )
}

function AshbyBrand({ size = 16 }: Props) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} aria-hidden="true">
      <circle cx="8" cy="5.5" r="3" fill="#3a3a3a" />
      <path fill="#3a3a3a" d="M2 14c0-3.3 2.7-5 6-5s6 1.7 6 5H2Z" />
    </svg>
  )
}

function CalendarBrand({ size = 16 }: Props) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} aria-hidden="true">
      <rect
        x="1.5"
        y="2.5"
        width="13"
        height="12"
        rx="2"
        fill="#fff"
        stroke="#4285F4"
        strokeWidth="1.3"
      />
      <rect x="3" y="6" width="10" height="1.5" fill="#EA4335" />
      <circle cx="5" cy="10" r="0.8" fill="#4285F4" />
      <circle cx="8" cy="10" r="0.8" fill="#FBBC04" />
      <circle cx="11" cy="10" r="0.8" fill="#34A853" />
    </svg>
  )
}

const MAP: Record<SourceKind, (p: Props) => React.JSX.Element> = {
  github: GitHubBrand,
  gmail: GmailBrand,
  slack: SlackBrand,
  discord: DiscordBrand,
  messenger: MessengerBrand,
  teams: TeamsBrand,
  figma: FigmaBrand,
  linear: LinearBrand,
  notion: NotionBrand,
  ashby: AshbyBrand,
  calendar: CalendarBrand,
}

export function BrandIcon({ kind, size }: { kind: SourceKind; size?: number }) {
  const Cmp = MAP[kind]
  return Cmp ? <Cmp size={size} /> : null
}
