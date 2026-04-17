import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'

interface CustomMarkerProps {
  map: mapboxgl.Map
  position: [number, number]
  address: string
}

export default function CustomMarker({ map, position, address }: CustomMarkerProps) {
  const markerRef = useRef<mapboxgl.Marker | null>(null)

  useEffect(() => {
    const el = document.createElement('div')
    el.innerHTML = `
      <div style="
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
      ">
        <div style="
          background: white;
          border-radius: 12px;
          padding: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          border: 2px solid #10b981;
          position: relative;
        ">
          <div style="
            width: 48px;
            height: 48px;
            border-radius: 8px;
            background: linear-gradient(135deg, #d4a574 0%, #8b7355 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
          ">📦</div>
        </div>
        <div style="
          width: 0;
          height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-top: 8px solid #10b981;
          margin-top: -1px;
        "></div>
        <div style="
          background: white;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 13px;
          white-space: nowrap;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          margin-top: 8px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        ">
          Ship to <strong>${address}</strong>
        </div>
      </div>
    `

    const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
      .setLngLat(position)
      .addTo(map)

    markerRef.current = marker

    return () => {
      marker.remove()
      markerRef.current = null
    }
  }, [map, position, address])

  return null
}
