export type WeatherResponse = {
  configured: boolean
  providerLabel: string
  fetchedAt?: string | null
  summary: string
  visibility?: number | null
  temperatureC?: number | null
  warning?: string | null
}
