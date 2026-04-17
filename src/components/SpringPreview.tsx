import React from 'react'

type Props = {
  mass: number
  stiffness: number
  damping: number
  width?: number
  height?: number
  exaggerate?: boolean
  overshootDemo?: boolean
}

export function SpringPreview({ mass, stiffness, damping, width = 140, height = 80, exaggerate = false, overshootDemo = false }: Props) {
  // simple semi-implicit Euler integration to visualize spring response to step(0->1)
  const W = width
  const H = height
  const n = 80
  let d = ''
  if (overshootDemo) {
    // Analytic underdamped response for a clear overshoot/undershoot visual
    const k = 3.2  // decay
    const w = 8.0  // frequency
    const beta = 0.35
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1)
      let y = 1 - Math.exp(-k * t) * (Math.cos(w * t) + beta * Math.sin(w * t))
      if (exaggerate) {
        const factor = 1.2
        y = y >= 1 ? 1 + (y - 1) * factor : y * factor
        y = Math.min(1.4, Math.max(0, y))
      }
      const X = t * W
      const base = 6
      const scale = (H / 2) - base
      const Y = Math.max(0, Math.min(H, H - (y * scale + base)))
      d += i === 0 ? `M ${X} ${Y}` : ` L ${X} ${Y}`
    }
  } else {
    // Numerical integration based on provided mass/stiffness/damping
    const dt = 1 / 120
    let t = 0
    let x = 0
    let v = 0
    const target = 1
    const pts: Array<{ t: number; x: number }> = [{ t: 0, x: 0 }]
    for (let i = 0; i < 12000; i++) {
      const F = -stiffness * (x - target) + -damping * v
      const a = F / Math.max(0.0001, mass)
      v += a * dt
      x += v * dt
      t += dt
      pts.push({ t, x })
      if (Math.abs(1 - x) < 0.01 && Math.abs(v) < 0.01 && t > dt * 10) break
    }
    const total = pts[pts.length - 1]?.t || 1
    for (let i = 0; i < n; i++) {
      const tt = (i / (n - 1)) * total
      let j = 0
      while (j + 1 < pts.length && pts[j + 1].t < tt) j++
      const a = pts[j]
      const b = pts[Math.min(j + 1, pts.length - 1)]
      const kk = (tt - a.t) / Math.max(1e-6, b.t - a.t)
      let y = a.x + (b.x - a.x) * kk
      if (exaggerate) {
        const factor = 1.25
        y = y >= 1 ? 1 + (y - 1) * factor : y * factor
        y = Math.min(1.4, Math.max(0, y))
      }
      const X = (tt / total) * W
      const base = 6
      const scale = (H / 2) - base
      const Y = Math.max(0, Math.min(H, H - (y * scale + base)))
      d += i === 0 ? `M ${X} ${Y}` : ` L ${X} ${Y}`
    }
  }
  return (
    <svg className="curve-box" width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-label="spring preview">
      <rect x="0" y="0" width={W} height={H} rx="8" fill="#0f0f0f" stroke="#2a2a2a" />
      <path d={`M0 ${H} L ${W} ${H}`} stroke="#333" />
      <path d={`M0 0 L 0 ${H}`} stroke="#333" />
      <path d={d} stroke="#5a31f4" fill="none" strokeWidth="2" />
    </svg>
  )
}


