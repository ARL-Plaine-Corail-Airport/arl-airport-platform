import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Rodrigues Airport Passenger Information Platform',
  description:
    'Official mobile-first platform for Plaine Corail Airport arrivals, departures, notices, passenger guidance, accessibility, transport, and contact information.',
}

// Pass-through: each route group provides its own <html><body>
// Required by Payload v3 because its RootLayout renders <html> itself.
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children as any
}
