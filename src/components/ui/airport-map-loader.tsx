'use client'

import dynamic from 'next/dynamic'

import type { PointOfInterest } from './airport-map'

const AirportLayoutMap = dynamic(
  () =>
    import('@/components/ui/airport-map').then((mod) => mod.AirportLayoutMap),
  {
    ssr: false,
    loading: () => (
      <div className="map-skeleton" aria-busy="true" />
    ),
  },
)

interface Props {
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

export function AirportMapLoader({ points, labels }: Props) {
  return <AirportLayoutMap points={points} labels={labels} />
}
