'use client'

import 'leaflet/dist/leaflet.css'

import L from 'leaflet'
import { useCallback, useEffect, useState } from 'react'
import {
  Circle,
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from 'react-leaflet'

const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

// Key locations in Rodrigues for transport context
const AIRPORT: [number, number] = [-19.7542, 63.3583]
const PORT_MATHURIN: [number, number] = [-19.6833, 63.4167]

// Main road route points (simplified road path from Port Mathurin to airport)
const MAIN_ROAD_ROUTE: [number, number][] = [
  PORT_MATHURIN,
  [-19.6870, 63.4100],
  [-19.6950, 63.4020],
  [-19.7050, 63.3950],
  [-19.7150, 63.3870],
  [-19.7250, 63.3790],
  [-19.7350, 63.3720],
  [-19.7450, 63.3670],
  AIRPORT,
]

function transportIcon(type: 'airport' | 'town' | 'stop') {
  const colors = { airport: '#1d4ed8', town: '#059669', stop: '#d97706' }
  const color = colors[type]
  return L.divIcon({
    className: 'directions-map-marker',
    html: `<div style="background:${color};width:14px;height:14px;border-radius:50%;border:2.5px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.3)"></div>`,
    iconSize: [19, 19],
    iconAnchor: [9, 9],
    popupAnchor: [0, -12],
  })
}

const userIcon = L.divIcon({
  className: 'locate-user-marker',
  html: '<div class="locate-user-dot"><div class="locate-user-dot-pulse"></div></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

interface DirectionsMapProps {
  labels: {
    directions_title: string
    directions_desc: string
    locate_me: string
    locating: string
    location_error: string
    airport_name: string
    airport_terminal_desc: string
    your_location: string
    port_mathurin: string
    port_mathurin_desc: string
    distance_info: string
    open_google_maps: string
  }
}

function FlyToUser({ position }: { position: [number, number] | null }) {
  const map = useMap()
  useEffect(() => {
    if (position) map.flyTo(position, 14, { duration: 1.2 })
  }, [map, position])
  return null
}

export function DirectionsMap({ labels }: DirectionsMapProps) {
  const center: [number, number] = [
    (AIRPORT[0] + PORT_MATHURIN[0]) / 2,
    (AIRPORT[1] + PORT_MATHURIN[1]) / 2,
  ]

  const [userPos, setUserPos] = useState<[number, number] | null>(null)
  const [accuracy, setAccuracy] = useState<number>(0)
  const [locating, setLocating] = useState(false)
  const [locateError, setLocateError] = useState<string | null>(null)

  const handleLocate = useCallback(() => {
    if (!navigator.geolocation) {
      setLocateError(labels.location_error)
      return
    }
    setLocating(true)
    setLocateError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos([pos.coords.latitude, pos.coords.longitude])
        setAccuracy(pos.coords.accuracy)
        setLocating(false)
      },
      () => {
        setLocateError(labels.location_error)
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }, [labels.location_error])

  const transportPoints = [
    {
      name: labels.airport_name,
      position: AIRPORT,
      description: labels.airport_terminal_desc,
      type: 'airport' as const,
    },
    {
      name: labels.port_mathurin,
      position: PORT_MATHURIN,
      description: labels.port_mathurin_desc,
      type: 'town' as const,
    },
  ]

  return (
    <div className="directions-map-wrapper">
      <div className="directions-map-header">
        <h2>{labels.directions_title}</h2>
        <p>{labels.directions_desc}</p>
      </div>

      <div className="map-locate-bar">
        <button
          type="button"
          className="map-locate-btn"
          onClick={handleLocate}
          disabled={locating}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
          </svg>
          {locating ? labels.locating : labels.locate_me}
        </button>
        {locateError && <span className="map-locate-error">{locateError}</span>}
      </div>

      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom={false}
        className="directions-map-container"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Polyline
          positions={MAIN_ROAD_ROUTE}
          pathOptions={{
            color: '#1d4ed8',
            weight: 4,
            opacity: 0.7,
            dashArray: '8, 8',
          }}
        />

        {transportPoints.map((point) => (
          <Marker
            key={point.name}
            position={point.position}
            icon={point.type === 'airport' ? defaultIcon : transportIcon(point.type)}
          >
            <Popup>
              <strong>{point.name}</strong>
              <br />
              {point.description}
            </Popup>
          </Marker>
        ))}

        {/* User location */}
        {userPos && (
          <>
            <Marker position={userPos} icon={userIcon}>
              <Popup>{labels.your_location}</Popup>
            </Marker>
            <Circle
              center={userPos}
              radius={accuracy}
              pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.1, weight: 1 }}
            />
          </>
        )}

        <FlyToUser position={userPos} />
      </MapContainer>

      {/* Open in Google Maps */}
      <a
        href={`https://www.google.com/maps/search/?api=1&query=${AIRPORT[0]},${AIRPORT[1]}`}
        target="_blank"
        rel="noopener noreferrer"
        className="map-locate-btn"
        style={{ alignSelf: 'flex-start' }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
        {labels.open_google_maps}
      </a>

      <div className="directions-map-info">
        <div className="directions-map-info-item">
          <span className="directions-map-dot" style={{ background: '#1d4ed8' }} />
          <span>{labels.airport_name}</span>
        </div>
        <div className="directions-map-info-item">
          <span className="directions-map-dot" style={{ background: '#059669' }} />
          <span>{labels.port_mathurin} ({labels.distance_info})</span>
        </div>
      </div>
    </div>
  )
}
