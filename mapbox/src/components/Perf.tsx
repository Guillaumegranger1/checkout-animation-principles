import { Canvas } from '@react-three/fiber'
import { Perf as R3FPerf } from 'r3f-perf'

export default function Perf() {
  return (
    <div className="perf-container">
      <Canvas
        style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          width: 300, 
          height: 160,
          pointerEvents: 'none',
          zIndex: 9999,
        }}
        gl={{ alpha: true }}
      >
        <R3FPerf position="top-left" />
      </Canvas>
    </div>
  )
}
