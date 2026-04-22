import type { TextFieldValidation } from 'payload'

type ValidateURLOptions = {
  allowedProtocols?: readonly string[]
  requiredMessage?: string
  invalidMessage?: string
}

const DEFAULT_URL_PROTOCOLS = ['http:', 'https:'] as const
const PHONE_PATTERN = /^\+?[0-9][0-9\s().-]{5,24}$/

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
    const allowedHosts = ['google.com', 'maps.google.com']

    if (!allowedHosts.includes(url.hostname)) {
      return 'Only Google Maps embed URLs from google.com or maps.google.com are allowed.'
    }

    if (url.protocol !== 'https:') {
      return 'Map embed URL must use HTTPS.'
    }

    return true
  } catch {
    return 'Please enter a valid URL.'
  }
}

export function validatePhoneValue(value: string | null | undefined) {
  const trimmedValue = value?.trim()

  if (!trimmedValue) return true

  if (!PHONE_PATTERN.test(trimmedValue)) {
    return 'Enter a valid phone number (e.g. +230 832 78 88).'
  }

  return true
}

export const validatePhone: TextFieldValidation = (value) => validatePhoneValue(value)
