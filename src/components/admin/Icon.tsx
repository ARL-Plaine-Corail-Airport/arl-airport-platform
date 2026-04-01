// Small icon shown in collapsed Payload admin nav
export default function Icon() {
  return (
    <div
      style={{
        width: 32,
        height: 32,
        background: 'hsl(210, 80%, 25%)',
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg
        viewBox="0 0 24 24"
        width="18"
        height="18"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
      </svg>
    </div>
  )
}
