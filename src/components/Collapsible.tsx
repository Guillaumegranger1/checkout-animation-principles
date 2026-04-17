import { useEffect, useRef, useState } from 'react'

type CollapsibleProps = {
  open: boolean
  expandMs?: number
  collapseMs?: number
  expandCubic?: [number, number, number, number]
  collapseCubic?: [number, number, number, number]
  expandEasing?: string
  collapseEasing?: string
  children: (state: { ref: React.RefObject<HTMLDivElement>, height: number }) => React.ReactNode
}

export function Collapsible({
  open,
  expandMs = 250,
  collapseMs = 150,
  expandCubic = [0.40, 0.70, 0.50, 1.00],
  collapseCubic = [0.50, 0.00, 0.60, 0.30],
  expandEasing,
  collapseEasing,
  children
}: CollapsibleProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState<number>(0)
  const [rendered, setRendered] = useState<boolean>(open)
  const expandTransition = `${expandMs}ms ${expandEasing ?? `cubic-bezier(${expandCubic.join(', ')})`}`
  const collapseTransition = `${collapseMs}ms ${collapseEasing ?? `cubic-bezier(${collapseCubic.join(', ')})`}`
  const currentTransition = open ? expandTransition : collapseTransition

  useEffect(() => {
    if (open) setRendered(true)
  }, [open])

  useEffect(() => {
    const el = contentRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      // Only update measurements while open to avoid jumps during collapse
      if (open) setHeight(el.scrollHeight)
    })
    ro.observe(el)
    // Initialize height on mount or when re-opening
    setHeight(el.scrollHeight)
    return () => ro.disconnect()
  }, [open])

  useEffect(() => {
    if (!open) {
      const timeout = setTimeout(() => setRendered(false), collapseMs) // match collapse duration
      return () => clearTimeout(timeout)
    }
  }, [open])

  return (
    <div
      className="collapse-root"
      style={{
        height: open ? height : 0,
        opacity: open ? 1 : 0,
        transition: `height ${currentTransition}, opacity ${currentTransition}`
      }}
    >
      <div
        ref={contentRef}
        aria-hidden={!open}
        style={{
          overflow: 'hidden',
          opacity: open ? 1 : 0,
          transition: `opacity ${currentTransition}`
        }}
      >
        {rendered ? children({ ref: contentRef, height }) : null}
      </div>
    </div>
  )
}


