'use client'

import dynamic from 'next/dynamic'

const DirectionsMap = dynamic(
  () =>
    import('@/components/ui/directions-map').then((mod) => mod.DirectionsMap),
  {
    ssr: false,
    loading: () => (
      <div className="map-skeleton" aria-busy="true" />
    ),
  },
)

interface Props {
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

export function DirectionsMapLoader({ labels }: Props) {
  return <DirectionsMap labels={labels} />
}
