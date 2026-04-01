'use client'

import 'leaflet/dist/leaflet.css'

import L from 'leaflet'
import { useCallback, useEffect, useState } from 'react'
import {
  Circle,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from 'react-leaflet'

// Fix default marker icons (Leaflet asset issue with bundlers)
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

const CATEGORY_KEYS = ['terminal', 'parking', 'transport', 'accessibility', 'security', 'services'] as const

const CATEGORY_COLORS: Record<string, string> = {
  terminal: '#1d4ed8',
  parking: '#059669',
  transport: '#d97706',
  accessibility: '#7c3aed',
  security: '#dc2626',
  services: '#0891b2',
}

function categoryIcon(category: string) {
  const color = CATEGORY_COLORS[category.toLowerCase()] ?? '#6b7280'
  return L.divIcon({
    className: 'airport-map-marker',
    html: `<div style="background:${color};width:12px;height:12px;border-radius:50%;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,0.3)"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -10],
  })
}

const userIcon = L.divIcon({
  className: 'locate-user-marker',
  html: '<div class="locate-user-dot"><div class="locate-user-dot-pulse"></div></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

export interface PointOfInterest {
  name: string
  category: string
  description: string
  lat?: number | null
  lng?: number | null
}

interface AirportMapProps {
  points: PointOfInterest[]
  labels: {
    points_of_interest: string
    no_points: string
    locate_me: string
    locating: string
    location_error: string
    airport_name: string
    airport_full_name: string
    your_location: string
    open_google_maps: string
    category_labels: Record<string, string>
  }
}

// Plaine Corail Airport coordinates
const AIRPORT_CENTER: [number, number] = [-19.7542, 63.3583]
const DEFAULT_ZOOM = 16

function FitBounds({ points }: { points: PointOfInterest[] }) {
  const map = useMap()

  useEffect(() => {
    const geoPoints = points.filter(
      (p) => p.lat != null && p.lng != null,
    ) as (PointOfInterest & { lat: number; lng: number })[]
    if (geoPoints.length > 1) {
      const bounds = L.latLngBounds(geoPoints.map((p) => [p.lat, p.lng]))
      map.fitBounds(bounds, { padding: [40, 40] })
    }
  }, [map, points])

  return null
}

function FlyToUser({ position }: { position: [number, number] | null }) {
  const map = useMap()
  useEffect(() => {
    if (position) map.flyTo(position, 16, { duration: 1.2 })
  }, [map, position])
  return null
}

export function AirportLayoutMap({ points, labels }: AirportMapProps) {
  const geoPoints = points.filter((p) => p.lat != null && p.lng != null)
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

  const getCategoryLabel = (cat: string) =>
    labels.category_labels[cat.toLowerCase()] ?? cat.charAt(0).toUpperCase() + cat.slice(1)

  return (
    <div className="airport-map-wrapper">
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
        center={AIRPORT_CENTER}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom={false}
        className="airport-map-container"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Airport center marker */}
        <Marker position={AIRPORT_CENTER} icon={defaultIcon}>
          <Popup>
            <strong>{labels.airport_name}</strong>
            <br />
            {labels.airport_full_name}
          </Popup>
        </Marker>

        {/* POI markers */}
        {geoPoints.map((point, i) => (
          <Marker
            key={`${point.name}-${i}`}
            position={[point.lat!, point.lng!]}
            icon={categoryIcon(point.category)}
          >
            <Popup>
              <strong>{point.name}</strong>
              <br />
              <span className="airport-map-popup-category">
                {getCategoryLabel(point.category)}
              </span>
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

        <FitBounds points={points} />
        <FlyToUser position={userPos} />
      </MapContainer>

      {/* Open in Google Maps */}
      <a
        href={`https://www.google.com/maps/search/?api=1&query=${AIRPORT_CENTER[0]},${AIRPORT_CENTER[1]}`}
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

      {/* Legend */}
      <div className="airport-map-legend">
        {CATEGORY_KEYS.map((cat) => (
          <span key={cat} className="airport-map-legend-item">
            <span
              className="airport-map-legend-dot"
              style={{ background: CATEGORY_COLORS[cat] }}
            />
            {getCategoryLabel(cat)}
          </span>
        ))}
      </div>

      {/* POI list below the map */}
      {points.length > 0 ? (
        <ul className="airport-map-poi-list">
          {points.map((point, i) => (
            <li key={`${point.name}-${i}`} className="airport-map-poi-item">
              <span
                className="airport-map-legend-dot"
                style={{
                  background:
                    CATEGORY_COLORS[point.category.toLowerCase()] ?? '#6b7280',
                }}
              />
              <div>
                <strong>{point.name}</strong>
                <span className="airport-map-poi-meta">
                  {getCategoryLabel(point.category)}
                </span>
                <p>{point.description}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="airport-map-empty">{labels.no_points}</p>
      )}
    </div>
  )
}
