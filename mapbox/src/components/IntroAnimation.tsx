import { useEffect, useState } from 'react'

interface IntroAnimationProps {
  onComplete: () => void
}

export default function IntroAnimation({ onComplete }: IntroAnimationProps) {
  const [phase, setPhase] = useState<'loading' | 'check' | 'moving' | 'done'>('loading')

  useEffect(() => {
    const timer0 = setTimeout(() => setPhase('check'), 1200)
    const timer1 = setTimeout(() => setPhase('moving'), 2200)
    const timer2 = setTimeout(() => {
      setPhase('done')
      onComplete()
    }, 2500)

    return () => {
      clearTimeout(timer0)
      clearTimeout(timer1)
      clearTimeout(timer2)
    }
  }, [onComplete])

  if (phase === 'done') return null

  return (
    <div className={`intro-overlay ${phase}`}>
      <div className={`intro-circle ${phase}`}>
        {phase === 'loading' ? (
          <div className="spinner" />
        ) : (
          <svg 
            className="intro-check" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2.5"
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" className="check-path" />
          </svg>
        )}
      </div>
    </div>
  )
}
