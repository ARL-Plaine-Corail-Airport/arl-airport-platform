import Link from 'next/link'

import { requireDashboardSectionAccess } from '@/lib/dashboard-auth'
import { getSiteSettings } from '@/lib/content'
import { env, serverEnv } from '@/lib/env'
import { getWeatherSnapshot } from '@/lib/integrations/weather'

export const metadata = { title: 'Weather' }

function InfoIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  )
}

function ExternalIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  )
}

export default async function WeatherPage() {
  await requireDashboardSectionAccess('weather')
  const [siteSettings, weather] = await Promise.all([getSiteSettings(), getWeatherSnapshot()])
  const providerConfigured = true // Open-Meteo is always available (no key required)

  return (
    <main className="page-content">
      <div className="page-title-row">
        <div>
          <h1 className="page-title">Weather Configuration</h1>
          <p className="page-subtitle">
            Review the provider and adapter state that drives public weather display
          </p>
        </div>
        <div className="page-actions">
          <Link href="/dashboard/settings" className="btn btn-primary">
            <ExternalIcon />
            Review Settings
          </Link>
        </div>
      </div>

      <div className="info-banner">
        <InfoIcon />
        <div>
          <strong>Weather integration:</strong> this app uses the server-side adapter in
          <code> src/lib/integrations/weather </code>
          plus environment variables. There is no Payload weather global, so this page reflects
          adapter state rather than linking to a non-existent admin route.
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Current Weather Display</h2>
            {weather.configured ? (
              <span className="badge badge-success">Configured</span>
            ) : (
              <span className="badge badge-muted">Not configured</span>
            )}
          </div>
          <div className="card-body">
            {weather.configured ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                  <div
                    style={{
                      fontSize: 20,
                      width: 72,
                      height: 72,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'hsl(var(--muted-bg))',
                      borderRadius: 'var(--radius)',
                      fontWeight: 700,
                    }}
                  >
                    WX
                  </div>
                  <div>
                    <div style={{ fontSize: 32, fontWeight: 700 }}>
                      {weather.temperatureC ?? '—'}°C
                    </div>
                    <div className="text-muted">{weather.summary ?? 'No conditions data'}</div>
                    <div className="text-xs text-muted" style={{ marginTop: 4 }}>
                      {siteSettings.airportName ?? 'Plaine Corail Airport'}
                    </div>
                  </div>
                </div>
                <div className="section-divider" />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span className="text-muted">Provider</span>
                  <span>{weather.providerLabel}</span>
                </div>
                {weather.visibility !== null && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span className="text-muted">Visibility</span>
                    <span>{weather.visibility} km</span>
                  </div>
                )}
                {weather.warning && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="text-muted">Warning</span>
                    <span>{weather.warning}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="empty-state" style={{ padding: '24px 0' }}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
                </svg>
                <h3>No weather data configured</h3>
                <p>
                  Connect a weather data provider through the deployment environment to display live
                  conditions.
                </p>
                <Link href="/dashboard/settings" className="btn btn-primary btn-sm" style={{ marginTop: 8 }}>
                  Review Settings
                </Link>
              </div>
            )}
          </div>
          {weather.fetchedAt && (
            <div className="card-footer">
              Last updated: {new Date(weather.fetchedAt).toLocaleString('en-GB')}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Data Source Settings</h2>
          </div>
          <div className="card-body">
            <div className="form-group">
              <span className="form-label">Weather Provider</span>
              <input
                className="form-input"
                type="text"
                value={`${env.weatherProviderLabel} (${env.weatherProviderMode})`}
                disabled
                readOnly
              />
              <span className="form-hint">Configured via environment variables and the weather adapter</span>
            </div>
            <div className="form-group">
              <span className="form-label">Airport Location</span>
              <input
                className="form-input"
                type="text"
                value={siteSettings.airportName ?? 'Plaine Corail Airport'}
                disabled
                readOnly
              />
            </div>
            <div className="form-group">
              <span className="form-label">Weather Endpoint</span>
              <input
                className="form-input"
                type="text"
                value={serverEnv.weatherProviderEndpoint || 'Not configured'}
                disabled
                readOnly
              />
              <span className="form-hint">Set `WEATHER_PROVIDER_ENDPOINT` in your environment</span>
            </div>
            <div className="form-group">
              <span className="form-label">API Key</span>
              <input
                className="form-input"
                type="text"
                value="Not required"
                disabled
                readOnly
              />
              <span className="form-hint">
                Open-Meteo does not require an API key for non-commercial use.
              </span>
            </div>
            <div className="section-divider" />
            <Link href="/dashboard/settings" className="btn btn-primary">
              <ExternalIcon />
              Open Integration Settings
            </Link>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Aviation Weather Overview</h2>
          <span className="badge badge-muted">Informational</span>
        </div>
        <div className="card-body">
          <p className="text-muted text-small" style={{ marginBottom: 16 }}>
            For official aviation weather and METARs, consult the Mauritius Meteorological Services.
            The data displayed on this dashboard is for passenger information only and should not be
            used for flight planning.
          </p>
          <div className="grid-3" style={{ marginBottom: 0 }}>
            <div
              style={{
                padding: '14px 16px',
                background: 'hsl(var(--muted-bg))',
                borderRadius: 'var(--radius)',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 24, marginBottom: 6 }}>T</div>
              <div className="stat-value" style={{ fontSize: 18 }}>
                {weather.temperatureC ?? '—'}
              </div>
              <div className="stat-label">Temperature</div>
            </div>
            <div
              style={{
                padding: '14px 16px',
                background: 'hsl(var(--muted-bg))',
                borderRadius: 'var(--radius)',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 24, marginBottom: 6 }}>S</div>
              <div className="stat-value" style={{ fontSize: 18 }}>
                {providerConfigured ? env.weatherProviderMode : '—'}
              </div>
              <div className="stat-label">Source Mode</div>
            </div>
            <div
              style={{
                padding: '14px 16px',
                background: 'hsl(var(--muted-bg))',
                borderRadius: 'var(--radius)',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 24, marginBottom: 6 }}>V</div>
              <div className="stat-value" style={{ fontSize: 18 }}>
                {weather.visibility ?? '—'}
              </div>
              <div className="stat-label">Visibility</div>
            </div>
          </div>
        </div>
        <div className="card-footer">
          For official METARs and TAFs, visit{' '}
          <a
            href="https://www.metservice.intnet.mu"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'hsl(var(--primary))' }}
          >
            metservice.intnet.mu
          </a>
        </div>
      </div>
    </main>
  )
}
