import React from 'react'

type SeqStatus = {
  totalFrames: number
  loadedFrames: number
  currentFrame: number
  playing: boolean
  ended: boolean
  totalBytes: number
}

export function DevHud() {
  const [status, setStatus] = React.useState<SeqStatus>({
    totalFrames: 0, loadedFrames: 0, currentFrame: 0, playing: false, ended: false, totalBytes: 0
  })
  const [fps, setFps] = React.useState(0)
  const [frameMs, setFrameMs] = React.useState(0)

  React.useEffect(() => {
    const onStatus = (e: Event) => {
      const detail = (e as CustomEvent).detail as SeqStatus
      setStatus(detail)
    }
    window.addEventListener('seq-status', onStatus as EventListener)
    return () => window.removeEventListener('seq-status', onStatus as EventListener)
  }, [])

  React.useEffect(() => {
    let rafId = 0
    let last = performance.now()
    let acc = 0
    let count = 0
    const loop = () => {
      const now = performance.now()
      const dt = now - last
      last = now
      acc += dt
      count++
      if (acc >= 250) {
        const avg = acc / count
        setFrameMs(avg)
        setFps(1000 / avg)
        acc = 0
        count = 0
      }
      rafId = requestAnimationFrame(loop)
    }
    rafId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafId)
  }, [])

  const kb = (status.totalBytes / 1024).toFixed(1)

  return (
    <div className="dev-hud">
      <div className="row"><span className="hud-label">FPS</span><span>{fps.toFixed(1)}</span></div>
      <div className="row"><span className="hud-label">Frame time</span><span>{frameMs.toFixed(1)} ms</span></div>
      <div className="row"><span className="hud-label">Frames</span><span>{status.loadedFrames}/{status.totalFrames}</span></div>
      <div className="row"><span className="hud-label">Payload</span><span>{kb} KB</span></div>
      <div className="row"><span className="hud-label">State</span><span>{status.playing ? 'playing' : status.ended ? 'ended' : 'idle'}</span></div>
    </div>
  )
}


