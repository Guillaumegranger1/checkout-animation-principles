import React from 'react'

type Pt = [number, number] // [tFraction 0..1, yValue (can overshoot >1)]

type Props = {
  points: Pt[]
  width?: number
  height?: number
}

export function LinearPreview({ points, width = 140, height = 80 }: Props) {
  const W = width
  const H = height
  // Normalize and clamp y a bit above 1 to show overshoot without clipping hard
  const YMAX = 1.3

  const toXY = (t: number, y: number) => {
    const base = 6
    const scale = (H / 2) - base
    const yy = Math.min(YMAX, Math.max(0, y))
    const X = t * W
    const Y = Math.max(0, Math.min(H, H - (yy * scale + base)))
    return [X, Y] as const
  }

  const path = (() => {
    if (!points.length) return ''
    const [x0, y0] = toXY(points[0][0], points[0][1])
    let d = `M ${x0} ${y0}`
    for (let i = 1; i < points.length; i++) {
      const [xx, yy] = toXY(points[i][0], points[i][1])
      d += ` L ${xx} ${yy}`
    }
    return d
  })()

  return (
    <svg className="curve-box" width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden>
      <rect x="0" y="0" width={W} height={H} rx="8" fill="#0f0f0f" stroke="#2a2a2a" />
      <path d={`M0 ${H} L ${W} ${H}`} stroke="#333" />
      <path d={`M0 0 L 0 ${H}`} stroke="#333" />
      {/* reference diagonal */}
      <path d={`M0 ${H - (H/2 - 6)} L ${W} ${6}`} stroke="#333" strokeDasharray="6 6" opacity="0.35" />
      <path d={path} stroke="#5a31f4" fill="none" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  )
}


