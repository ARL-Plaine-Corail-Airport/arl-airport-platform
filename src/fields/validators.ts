import type { TextFieldValidation } from 'payload'

type ValidateURLOptions = {
  allowedProtocols?: readonly string[]
  requiredMessage?: string
  invalidMessage?: string
}

const DEFAULT_URL_PROTOCOLS = ['http:', 'https:'] as const

export const validateURL = (
  value: string | null | undefined,
  { allowedProtocols = DEFAULT_URL_PROTOCOLS, requiredMessage, invalidMessage }: ValidateURLOptions = {},
) => {
  const trimmedValue = value?.trim()

  if (!trimmedValue) {
    return requiredMessage ?? true
  }

  try {
    const url = new URL(trimmedValue)

    if (!allowedProtocols.includes(url.protocol)) {
      return invalidMessage ?? 'Please enter a valid URL.'
    }

    return true
  } catch {
    return invalidMessage ?? 'Please enter a valid URL.'
  }
}

export const validateMapEmbedURL: TextFieldValidation = (value) => {
  const trimmedValue = value?.trim()

  if (!trimmedValue) return true

  try {
    const url = new URL(trimmedValue)
    const allowedHosts = ['google.com', 'www.google.com', 'maps.google.com', 'openstreetmap.org', 'www.openstreetmap.org']

    if (!allowedHosts.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`))) {
      return 'Only Google Maps and OpenStreetMap embed URLs are allowed.'
    }

    if (url.protocol !== 'https:') {
      return 'Map embed URL must use HTTPS.'
    }

    return true
  } catch {
    return 'Please enter a valid URL.'
  }
}
