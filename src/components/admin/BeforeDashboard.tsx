import Link from 'next/link'

// Welcome banner shown at the top of the Payload admin dashboard
// Styled to match the /dashboard design language
export default function BeforeDashboard() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        padding: '14px 20px',
        marginBottom: 24,
        background: 'hsl(210, 80%, 25%)',
        borderRadius: 8,
        color: '#fff',
        boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 36,
            height: 36,
            background: 'hsla(0,0%,100%,0.15)',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            flexShrink: 0,
          }}
        >
          AP
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.2 }}>
            Airport of Rodrigues Content Platform
          </div>
          <div style={{ fontSize: 12, color: 'hsla(0,0%,100%,0.7)', marginTop: 2 }}>
            Manage all airport content from this panel
          </div>
        </div>
      </div>
      <Link
        href="/dashboard"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '7px 14px',
          background: 'hsla(0,0%,100%,0.15)',
          border: '1px solid hsla(0,0%,100%,0.3)',
          borderRadius: 6,
          color: '#fff',
          textDecoration: 'none',
          fontSize: 12,
          fontWeight: 600,
          whiteSpace: 'nowrap',
        }}
      >
        Open Custom Dashboard
      </Link>
    </div>
  )
}
