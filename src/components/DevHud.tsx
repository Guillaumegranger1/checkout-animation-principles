import React from 'react'

type SeqStatus = {
  totalFrames: number
  loadedFrames: number
  currentFrame: number
  playing: boolean
  ended: boolean
  totalBytes?: number
}

export function DevHud() {
  const [fps, setFps] = React.useState(0)
  const [ms, setMs] = React.useState(0)
  const [seq, setSeq] = React.useState<SeqStatus>({
    totalFrames: 0,
    loadedFrames: 0,
    currentFrame: 0,
    playing: false,
    ended: false,
    totalBytes: 0
  })

  React.useEffect(() => {
    let rafId = 0
    let last = performance.now()
    let acc = 0
    let frames = 0
    const loop = () => {
      const now = performance.now()
      const delta = now - last
      last = now
      acc += delta
      frames += 1
      // Update approx every 250ms
      if (acc >= 250) {
        const avg = acc / frames
        setMs(avg)
        setFps(1000 / avg)
        acc = 0
        frames = 0
      }
      rafId = requestAnimationFrame(loop)
    }
    rafId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafId)
  }, [])

  React.useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<SeqStatus>).detail
      if (!detail) return
      setSeq(prev => ({ ...prev, ...detail }))
    }
    window.addEventListener('seq-status', handler as EventListener)
    return () => window.removeEventListener('seq-status', handler as EventListener)
  }, [])

  const kb = seq.totalBytes ? (seq.totalBytes / 1024).toFixed(1) : '0.0'
  const state = seq.playing ? 'playing' : (seq.ended ? 'ended' : (seq.loadedFrames === seq.totalFrames && seq.totalFrames > 0 ? 'ready' : 'preloading'))

  return (
    <div className="dev-hud" role="status" aria-live="polite">
      <div className="hud-row">
        <div className="hud-box">
          <span className="hud-num">{fps.toFixed(0)}</span>
          <span className="hud-label">FPS</span>
        </div>
        <div className="hud-box">
          <span className="hud-num">{ms.toFixed(1)}</span>
          <span className="hud-label">ms</span>
        </div>
        <div className="hud-box">
          <span className="hud-num">
            {seq.loadedFrames}/{seq.totalFrames}
          </span>
          <span className="hud-label">frames</span>
        </div>
        <div className="hud-box">
          <span className="hud-num">{kb}kB</span>
          <span className="hud-label">payload</span>
        </div>
        <div className="hud-box">
          <span className="hud-num">{state}</span>
          <span className="hud-label">state</span>
        </div>
      </div>
    </div>
  )
}


