'use client'

import { WeatherPreview } from '@/components/ui/weather-preview'
import { useI18n } from '@/i18n/provider'
import { useLiveApiData } from '@/hooks/use-live-api-data'
import type { WeatherResponse } from '@/lib/integrations/weather/types'

const WEATHER_REFRESH_INTERVAL_MS = 300_000

type WeatherPreviewLiveProps = {
  initialWeather: WeatherResponse
}

export function WeatherPreviewLive({
  initialWeather,
}: WeatherPreviewLiveProps) {
  const { t } = useI18n()
  const { data, error } = useLiveApiData<WeatherResponse>({
    initialData: initialWeather,
    refreshIntervalMs: WEATHER_REFRESH_INTERVAL_MS,
    url: '/api/weather',
  })

  if (error) {
    return (
      <div className="weather-card weather-card__fallback" role="status" aria-live="polite">
        <div className="weather-card__fallback-copy">
          <p className="weather-card__eyebrow">{t('weather.title')}</p>
          <h2 className="weather-card__fallback-title">Temporarily unavailable</h2>
          <p className="weather-card__condition">Live weather updates will resume automatically.</p>
        </div>
      </div>
    )
  }

  return <WeatherPreview weather={data} />
}
