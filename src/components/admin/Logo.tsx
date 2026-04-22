// Logo shown in the Payload admin header bar (white background)
export default function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
      <div
        style={{
          width: 36,
          height: 36,
          background: 'hsl(var(--arl-navy-700))',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="white"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
        </svg>
      </div>
      <div style={{ lineHeight: 1.25 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: 'hsl(var(--arl-navy-700))', letterSpacing: '-0.01em' }}>
          ARL Admin
        </div>
        <div style={{ fontSize: 10, color: 'hsl(210, 10%, 55%)', letterSpacing: '0.3px' }}>
          Airport of Rodrigues
        </div>
      </div>
    </div>
  )
}
