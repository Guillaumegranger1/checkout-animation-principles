import React from 'react'
import { SvgSequencePlayer } from './components/SvgSequencePlayer'

export function App() {
  const [restartKey, setRestartKey] = React.useState(0)
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', gap: 20, background: '#0f0f0f' }}>
      <SvgSequencePlayer fps={60} size={111} padding={18} loop={false} restartKey={restartKey} />
      <button
        onClick={() => setRestartKey(k => k + 1)}
        style={{
          height: 34,
          padding: '0 12px',
          borderRadius: 10,
          border: '1px solid #333',
          background: '#fff',
          fontWeight: 700,
          cursor: 'pointer'
        }}
      >
        Restart animation
      </button>
    </div>
  )
}


