import React from 'react'

type SvgSequencePlayerProps = {
  fps?: number
  size?: number
  padding?: number
  loop?: boolean
  restartKey?: number
}

const framesImport = import.meta.glob('../assets/svg-sequence/*.svg', { eager: true, query: '?url', import: 'default' })
const frameUrls = Object.entries(framesImport)
  .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
  .map(([, url]) => url as string)

export const svgSequenceFrameCount = frameUrls.length

export function SvgSequencePlayer({
  fps = 24,
  size = 220,
  padding = 24,
  loop = true,
  restartKey = 0
}: SvgSequencePlayerProps) {
  const [frame, setFrame] = React.useState(0)
  const intervalRef = React.useRef<number | null>(null)
  const [isReady, setIsReady] = React.useState(false)
  const totalBytesRef = React.useRef<number>(0)

  React.useEffect(() => {
    let cancelled = false
    setIsReady(false)
    setFrame(0)
    totalBytesRef.current = 0
    if (frameUrls.length === 0) {
      setIsReady(true)
      window.dispatchEvent(new CustomEvent('seq-status', {
        detail: {
          totalFrames: 0,
          loadedFrames: 0,
          currentFrame: 0,
          playing: false,
          ended: false,
          totalBytes: 0
        }
      }))
      return
    }
    window.dispatchEvent(new CustomEvent('seq-status', {
      detail: {
        totalFrames: frameUrls.length,
        loadedFrames: 0,
        currentFrame: 0,
        playing: false,
        ended: false,
        totalBytes: 0
      }
    }))
    const preload = async () => {
      const tasks = frameUrls.map(async (url) => {
        try {
          const res = await fetch(url)
          const blob = await res.blob()
          totalBytesRef.current += blob.size
        } catch {}
        await new Promise<void>(resolve => {
          const img = new Image()
          img.onload = () => resolve()
          img.onerror = () => resolve()
          img.src = url
        })
      })
      await Promise.all(tasks)
      if (!cancelled) setIsReady(true)
      window.dispatchEvent(new CustomEvent('seq-status', {
        detail: {
          totalFrames: frameUrls.length,
          loadedFrames: frameUrls.length,
          currentFrame: 0,
          playing: false,
          ended: false,
          totalBytes: totalBytesRef.current
        }
      }))
    }
    preload()
    return () => { cancelled = true }
  }, [restartKey])

  React.useEffect(() => {
    if (frameUrls.length === 0) return
    if (!isReady) return
    const frameIntervalMs = 1000 / Math.max(1, fps)
    let idx = 0
    setFrame(0)
    window.dispatchEvent(new CustomEvent('seq-status', {
      detail: {
        totalFrames: frameUrls.length,
        loadedFrames: frameUrls.length,
        currentFrame: 0,
        playing: true,
        ended: false,
        totalBytes: totalBytesRef.current
      }
    }))
    intervalRef.current = window.setInterval(() => {
      idx += 1
      if (idx >= frameUrls.length) {
        if (loop) idx = 0
        else {
          window.clearInterval(intervalRef.current!)
          intervalRef.current = null
          idx = frameUrls.length - 1
        }
      }
      setFrame(idx)
      window.dispatchEvent(new CustomEvent('seq-status', {
        detail: {
          totalFrames: frameUrls.length,
          loadedFrames: frameUrls.length,
          currentFrame: idx,
          playing: intervalRef.current !== null,
          ended: intervalRef.current === null && idx === frameUrls.length - 1,
          totalBytes: totalBytesRef.current
        }
      }))
    }, frameIntervalMs) as unknown as number
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current)
    }
  }, [fps, loop, restartKey, isReady])

  const diameter = size
  const inner = size - padding * 2

  return (
    <div className="sequence-circle" style={{ width: diameter, height: diameter, padding }}>
      <div className="sequence-inner" style={{ width: inner, height: inner }}>
        {frameUrls.length > 0 ? (
          // eslint-disable-next-line jsx-a11y/alt-text
          <img className="sequence-img" src={frameUrls[frame]} />
        ) : (
          <div className="sequence-empty muted" style={{ textAlign: 'center' }}>
            Drop SVG frames into <code>src/assets/svg-sequence</code>
          </div>
        )}
      </div>
    </div>
  )
}


