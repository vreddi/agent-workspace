import * as React from 'react'

export type DialogueBoxProps = {
  /** The line of dialogue. Changing it restarts the typewriter. */
  text: string
  speaker?: string
  /** Portrait image URL (rendered pixelated at 56px). */
  portrait?: string
  /** Characters revealed per second. Default 45. */
  speed?: number
  /**
   * Advance requested: first click/keypress completes the typewriter, the
   * next one fires this (show the next line, or close the box).
   */
  onAdvance?: () => void
  className?: string
  style?: React.CSSProperties
}

const FONT_STACK =
  "'Press Start 2P', 'Courier New', ui-monospace, Menlo, monospace"

/**
 * Classic retro dialogue box: navy double border, white panel, typewriter
 * text, and a bobbing advance arrow. Click it (or press Enter/Space) to
 * fast-forward, then advance.
 */
export function DialogueBox({
  text,
  speaker,
  portrait,
  speed = 45,
  onAdvance,
  className,
  style,
}: DialogueBoxProps) {
  const [visible, setVisible] = React.useState(0)
  const complete = visible >= text.length

  React.useEffect(() => {
    setVisible(0)
    const interval = window.setInterval(() => {
      setVisible((count) => {
        if (count >= text.length) {
          window.clearInterval(interval)
          return count
        }
        return count + 1
      })
    }, 1000 / speed)
    return () => window.clearInterval(interval)
  }, [text, speed])

  const advance = React.useCallback(() => {
    if (!complete) {
      setVisible(text.length)
      return
    }
    onAdvance?.()
  }, [complete, text, onAdvance])

  React.useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Enter' || event.key === ' ' || event.key === 'z') {
        event.preventDefault()
        advance()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [advance])

  return (
    <div
      data-slot="dialogue-box"
      role="dialog"
      aria-label={speaker ? `${speaker} says` : 'Dialogue'}
      onClick={advance}
      className={className}
      style={{
        position: 'relative',
        cursor: 'pointer',
        userSelect: 'none',
        fontFamily: FONT_STACK,
        ...style,
      }}
    >
      {speaker ? (
        <div
          style={{
            position: 'absolute',
            top: -14,
            left: 14,
            zIndex: 1,
            padding: '4px 10px',
            background: '#f8b840',
            border: '3px solid #38487c',
            borderRadius: 8,
            color: '#38487c',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 1,
            textTransform: 'uppercase',
          }}
        >
          {speaker}
        </div>
      ) : null}
      <div
        style={{
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          padding: '16px 18px',
          background: '#f8f8f0',
          border: '4px solid #38487c',
          borderRadius: 10,
          boxShadow: 'inset 0 0 0 2px #98a8d8, 0 3px 0 rgba(0, 0, 0, 0.25)',
        }}
      >
        {portrait ? (
          <img
            src={portrait}
            alt=""
            width={56}
            height={56}
            style={{
              flexShrink: 0,
              imageRendering: 'pixelated',
              background: '#dce8f8',
              border: '3px solid #38487c',
              borderRadius: 8,
            }}
          />
        ) : null}
        <p
          style={{
            margin: 0,
            minHeight: '2.9em',
            color: '#30343c',
            fontSize: 13,
            lineHeight: 1.45,
            letterSpacing: 0.5,
            whiteSpace: 'pre-wrap',
          }}
        >
          {text.slice(0, visible)}
        </p>
      </div>
      {complete ? (
        <span
          aria-hidden
          style={{
            position: 'absolute',
            right: 14,
            bottom: 8,
            color: '#d84860',
            fontSize: 14,
            animation: 'worldkit-arrow-bob 600ms ease-in-out infinite',
          }}
        >
          ▼
        </span>
      ) : null}
      <style>{`
        @keyframes worldkit-arrow-bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(3px); }
        }
      `}</style>
    </div>
  )
}
