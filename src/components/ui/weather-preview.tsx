'use client'

import { useI18n } from '@/i18n/provider'
import { formatDateTime } from '@/lib/date'
import type { WeatherResponse } from '@/lib/integrations/weather/types'

function WeatherIcon() {
  return (
    <svg
      width="44"
      height="44"
      fill="none"
      stroke="hsl(0 0% 100% / 0.9)"
      strokeWidth="1.5"
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
  )
}

export function WeatherPreview({ weather }: { weather: WeatherResponse }) {
  const { t, locale } = useI18n()

  if (!weather.configured) {
    return (
      <div className="weather-card weather-card__fallback">
        <div className="weather-card__fallback-copy">
          <p className="weather-card__eyebrow">{t('weather.title')}</p>
          <h2 className="weather-card__fallback-title">{weather.summary}</h2>
          <p className="weather-card__condition">{weather.providerLabel}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="weather-card">
      <div className="weather-card__header">
        <div className="weather-card__eyebrow-row">
          <p className="weather-card__eyebrow">{t('weather.title')}</p>
          <span className="weather-card__provider-chip">{weather.providerLabel}</span>
        </div>

        <div className="weather-card__top">
          <WeatherIcon />
          <div>
            {weather.temperatureC != null ? (
              <p className="weather-card__temp">{weather.temperatureC}°C</p>
            ) : null}
            <p className="weather-card__condition">{weather.summary}</p>
          </div>
        </div>
      </div>

      <div className="weather-card__body">
        {(weather.visibility || weather.warning) ? (
          <div className="weather-card__chips">
            {weather.visibility ? (
              <span className="weather-card__chip">
                {t('weather.visibility')} {weather.visibility} {t('weather.km')}
              </span>
            ) : null}
            {weather.warning ? (
              <span className="weather-card__chip weather-card__chip--warning">
                {weather.warning}
              </span>
            ) : null}
          </div>
        ) : null}

        <div className="weather-card__footer">
          <p className="type-xs">
            {weather.fetchedAt ? formatDateTime(weather.fetchedAt, locale) : weather.providerLabel}
          </p>
        </div>
      </div>
    </div>
  )
}
