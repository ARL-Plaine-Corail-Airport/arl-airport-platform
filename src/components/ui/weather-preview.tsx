'use client'

import { formatDateTime } from '@/lib/date'
import { useI18n } from '@/i18n/provider'
import type { WeatherResponse } from '@/lib/integrations/weather/types'

export function WeatherPreview({ weather }: { weather: WeatherResponse }) {
  const { t, locale } = useI18n()

  if (!weather.configured) {
    return (
      <div className="weather-card">
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>{t('weather.title')}</h2>
        <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>{weather.summary}</p>
        <div className="weather-card__footer">
          <p style={{ fontSize: '0.75rem', color: 'var(--muted)', fontStyle: 'italic' }}>
            {weather.providerLabel}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="weather-card">
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>{t('weather.title')}</h2>

      <div className="weather-card__top">
        <svg
          width="40"
          height="40"
          fill="none"
          stroke="var(--secondary)"
          strokeWidth="2"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M12 2v2" />
          <path d="m4.93 4.93 1.41 1.41" />
          <path d="M20 12h2" />
          <path d="m19.07 4.93-1.41 1.41" />
          <path d="M15.947 12.65a4 4 0 0 0-5.925-4.128" />
          <path d="M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z" />
        </svg>
        <div>
          {weather.temperatureC != null && (
            <p className="weather-card__temp">{weather.temperatureC}&deg;C</p>
          )}
          <p className="weather-card__condition">{weather.summary}</p>
        </div>
      </div>

      {(weather.visibility || weather.warning) && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem',
            marginBottom: '0.5rem',
          }}
        >
          {weather.visibility && (
            <div className="weather-card__detail">
              <span>{t('weather.visibility')}</span>
              <span>{weather.visibility} {t('weather.km')}</span>
            </div>
          )}
          {weather.warning && (
            <div className="weather-card__detail" style={{ color: 'var(--warning-fg)' }}>
              <span>{t('weather.advisory')}</span>
              <span>{weather.warning}</span>
            </div>
          )}
        </div>
      )}

      <div className="weather-card__footer">
        <p style={{ fontSize: '0.75rem', color: 'var(--muted)', fontStyle: 'italic' }}>
          {weather.providerLabel}
          {weather.fetchedAt ? ` · ${formatDateTime(weather.fetchedAt, locale)}` : ''}
        </p>
      </div>
    </div>
  )
}
