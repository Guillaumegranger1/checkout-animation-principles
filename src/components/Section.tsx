import { ReactNode } from 'react'
import { Collapsible } from './Collapsible'

type SectionProps = {
  title: string
  summary?: ReactNode
  open: boolean
  onToggle: () => void
  children: ReactNode
  transitions?: {
    expandMs?: number
    collapseMs?: number
    expandCubic?: [number, number, number, number]
    collapseCubic?: [number, number, number, number]
    expandEasing?: string
    collapseEasing?: string
  }
  rightSlot?: ReactNode
  showChevron?: boolean
}

export function Section({ title, summary, open, onToggle, children, transitions, rightSlot, showChevron = true }: SectionProps) {
  return (
    <div className="section">
      <div className={`section-header ${open ? 'open' : ''}`} onClick={onToggle} role="button" aria-expanded={open}>
        <div className="section-label">{title}</div>
        <div className={`section-value ${open ? 'value-hidden' : ''}`} aria-hidden={open}>
          {summary}
        </div>
        {rightSlot ? (
          <span className="section-right" aria-hidden>
            {rightSlot}
          </span>
        ) : showChevron ? (
          <Chevron open={open} />
        ) : (
          <span aria-hidden />
        )}
      </div>
      <Collapsible
        open={open}
        expandMs={transitions?.expandMs}
        collapseMs={transitions?.collapseMs}
        expandCubic={transitions?.expandCubic}
        collapseCubic={transitions?.collapseCubic}
        expandEasing={transitions?.expandEasing}
        collapseEasing={transitions?.collapseEasing}
      >
        {() => (
          <div className="section-body">
            {children}
          </div>
        )}
      </Collapsible>
    </div>
  )
}

function Chevron({ open }: { open: boolean }) {
  return (
    <span className="arrow-stack" aria-hidden>
      {/* Down arrow (closed state) */}
      <svg
        width="18" height="18" viewBox="0 0 24 24" fill="none"
        className={`arrow-icon chevron ${open ? 'hide' : 'show'}`}
      >
        <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {/* Up arrow (open state) */}
      <svg
        width="18" height="18" viewBox="0 0 24 24" fill="none"
        className={`arrow-icon chevron ${open ? 'show' : 'hide'}`}
      >
        <path d="M6 15l6-6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  )
}


