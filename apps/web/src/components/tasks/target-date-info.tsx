import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@org/ui/components/popover'
import { Info } from 'lucide-react'

/**
 * Small info balloon shown beside the Target date label in the task
 * create/edit forms. Explains what a target date means so the field isn't
 * confused with the hard deadline. Styling is self-contained (inline / the
 * popover's own classes) so it renders the same in the Today capture palette
 * and the task detail editor, which load different stylesheets.
 */
export function TargetDateInfo() {
  return (
    <Popover>
      <PopoverTrigger
        type="button"
        aria-label="What is a target date?"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 16,
          height: 16,
          padding: 0,
          border: 'none',
          borderRadius: 999,
          background: 'transparent',
          color: 'var(--t-ink-3)',
          cursor: 'pointer',
        }}
      >
        <Info aria-hidden size={14} />
      </PopoverTrigger>
      <PopoverContent align="start" style={{ width: 260 }}>
        <p
          style={{
            margin: '0 0 4px',
            fontSize: 12,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            color: 'var(--t-ink-2)',
          }}
        >
          Target date
        </p>
        <p
          style={{
            margin: 0,
            fontSize: 13,
            lineHeight: 1.5,
            color: 'var(--t-ink-2)',
          }}
        >
          The date you're aiming to complete this task by. By default the task
          is scheduled for that date; tick “OK to finish early” if wrapping it
          up sooner is fine.
        </p>
      </PopoverContent>
    </Popover>
  )
}
