import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import CustomMarker from './CustomMarker'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || ''
mapboxgl.accessToken = MAPBOX_TOKEN

const DELIVERY_LOCATION: [number, number] = [-75.696761, 45.418973]
const DELIVERY_ADDRESS = "151 O'Connor St"

interface MapProps {
  showMarker?: boolean
}

export default function Map({ showMarker = true }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<mapboxgl.Map | null>(null)
  const hasAnimated = useRef(false)

  useEffect(() => {
    if (!mapContainer.current) return

    if (!MAPBOX_TOKEN) {
      console.error('Missing VITE_MAPBOX_TOKEN. Create a .env file with your Mapbox token.')
      return
    }

    const mapInstance = new mapboxgl.Map({
      container: mapContainer.current,
      center: DELIVERY_LOCATION,
      zoom: 13,
      pitch: -20,
      bearing: 0,
      style: 'mapbox://styles/mapbox/standard',
      antialias: true,
    })

    mapInstance.on('error', (e) => {
      console.error('Mapbox error:', e.error)
    })

    mapInstance.on('style.load', () => {
      mapInstance.setConfigProperty('basemap', 'lightPreset', 'day')
      mapInstance.setConfigProperty('basemap', 'showPointOfInterestLabels', false)
      mapInstance.setConfigProperty('basemap', 'showTransitLabels', false)
    })

    mapInstance.on('load', () => {
      mapInstance.resize()
      setMap(mapInstance)
    })

    return () => {
      mapInstance.remove()
    }
  }, [])

  useEffect(() => {
    if (map && showMarker && !hasAnimated.current) {
      hasAnimated.current = true
      map.easeTo({
        pitch: 65,
        zoom: 15.5,
        duration: 1500,
        easing: (t) => 1 - Math.pow(1 - t, 3),
      })
    }
  }, [map, showMarker])

  return (
    <div className="map-wrapper">
      <div ref={mapContainer} className="map-container" />
      {map && showMarker && (
        <CustomMarker 
          map={map} 
          position={DELIVERY_LOCATION} 
          address={DELIVERY_ADDRESS} 
        />
      )}
    </div>
  )
}
