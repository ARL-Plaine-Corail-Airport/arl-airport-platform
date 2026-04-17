import { act } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { WeatherPreview } from '@/components/ui/weather-preview'
import { I18nProvider } from '@/i18n/provider'
import type { WeatherResponse } from '@/lib/integrations/weather/types'

const dictionary = {
  weather: {
    title: 'Weather',
    visibility: 'Visibility',
    km: 'km',
    advisory: 'Advisory',
  },
} as any

const weather: WeatherResponse = {
  configured: true,
  providerLabel: 'Weather API',
  fetchedAt: '2025-06-15T14:30:00Z',
  summary: 'Clear skies',
  visibility: 10,
  temperatureC: 24,
  warning: null,
}

let renderPhase: 'server' | 'client' = 'server'

function renderSubject() {
  return (
    <I18nProvider locale="en" dictionary={dictionary}>
      <WeatherPreview weather={weather} />
    </I18nProvider>
  )
}

describe('WeatherPreview hydration', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    document.body.innerHTML = ''
    renderPhase = 'server'
  })

  it('hydrates without timezone-driven text mismatches', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    function MockDateTimeFormat(
      _locale?: string | string[],
      options?: Intl.DateTimeFormatOptions,
    ) {
      const formattedValue =
        options?.timeZone === 'Indian/Mauritius'
          ? '15 Jun 2025, 18:30'
          : renderPhase === 'server'
            ? '15 Jun 2025, 14:30'
            : '15 Jun 2025, 10:30'

      return {
        format: () => formattedValue,
      }
    }

    vi.spyOn(Intl, 'DateTimeFormat').mockImplementation(
      MockDateTimeFormat as unknown as typeof Intl.DateTimeFormat,
    )

    renderPhase = 'server'
    const html = renderToString(renderSubject())
    document.body.innerHTML = `<div id="root">${html}</div>`

    const rootElement = document.getElementById('root')
    expect(rootElement).not.toBeNull()
    if (!rootElement) {
      throw new Error('Expected hydration root to exist')
    }

    renderPhase = 'client'
    let root: ReturnType<typeof hydrateRoot> | null = null

    await act(async () => {
      root = hydrateRoot(rootElement, renderSubject())
      await Promise.resolve()
    })

    expect(rootElement.textContent).toContain('15 Jun 2025, 18:30')

    const hydrationSignals = consoleError.mock.calls
      .map((call) => call.map((entry) => String(entry)).join(' '))
      .filter((message) =>
        /hydration|did not match|server rendered html|text content does not match/i.test(message),
      )

    expect(hydrationSignals).toEqual([])

    await act(async () => {
      root?.unmount()
      await Promise.resolve()
    })
  })
})
