import React from 'react'

type Props = {
  x1: number
  y1: number
  x2: number
  y2: number
  width?: number
  height?: number
  label?: string
}

export function BezierPreview({ x1, y1, x2, y2, width = 140, height = 80, label }: Props) {
  // SVG cubic-bezier control points are in normalized [0,1]
  const p1x = x1 * width
  const p1y = (1 - y1) * height
  const p2x = x2 * width
  const p2y = (1 - y2) * height
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <svg className="curve-box" width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden>
        <rect x="0" y="0" width={width} height={height} rx="8" fill="#0f0f0f" stroke="#2a2a2a" />
        {/* Axes */}
        <path d={`M0 ${height} L ${width} ${height}`} stroke="#333" />
        <path d={`M0 0 L 0 ${height}`} stroke="#333" />
        {/* Curve from (0,height) to (width,0) */}
        <path d={`M0 ${height} C ${p1x} ${p1y}, ${p2x} ${p2y}, ${width} 0`} stroke="#5a31f4" fill="none" strokeWidth="2" />
      </svg>
      {label ? <span style={{ color: '#eaeaea', fontSize: 12 }}>{label}</span> : null}
    </div>
  )
}


