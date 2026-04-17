export default function Loading() {
  return (
    <div className="loading-screen loading-screen--shell" aria-busy="true" aria-label="Loading page">
      <div className="loading-shell">
        <div className="loading-shell__hero skeleton" />
        <div className="loading-shell__grid">
          <div className="loading-shell__card skeleton" />
          <div className="loading-shell__card skeleton" />
          <div className="loading-shell__card skeleton" />
        </div>
      </div>
    </div>
  )
}
