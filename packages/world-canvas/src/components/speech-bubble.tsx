import * as React from 'react'

export type SpeechBubbleProps = {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

/** Tiny emote bubble that floats above a character's head. */
export function SpeechBubble({
  children,
  className,
  style,
}: SpeechBubbleProps) {
  return (
    <div
      data-slot="speech-bubble"
      className={className}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 18,
        height: 18,
        padding: '0 4px',
        background: '#ffffff',
        border: '2px solid #38487c',
        borderRadius: 6,
        color: '#38487c',
        fontFamily: "'Courier New', ui-monospace, monospace",
        fontSize: 12,
        fontWeight: 700,
        lineHeight: 1,
        boxShadow: '0 1px 0 rgba(0, 0, 0, 0.25)',
        animation: 'worldkit-bubble-pop 180ms ease-out',
        ...style,
      }}
    >
      {children}
      <span
        aria-hidden
        style={{
          position: 'absolute',
          bottom: -6,
          left: '50%',
          width: 6,
          height: 6,
          background: '#ffffff',
          borderRight: '2px solid #38487c',
          borderBottom: '2px solid #38487c',
          transform: 'translateX(-50%) rotate(45deg)',
        }}
      />
      <style>{`
        @keyframes worldkit-bubble-pop {
          0% { transform: scale(0.4); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
