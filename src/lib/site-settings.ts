type LocalizedText = string | null | undefined | Record<string, string | null | undefined>

const LEGACY_AIRPORT_NAME_PATTERN = /^sir ga(?:e|ë)tan duval airport$/i
const LEGACY_AIRPORT_ADDRESS_PATTERN = /sir ga(?:e|ë)tan duval airport/gi
const MODERN_AIRPORT_NAME = 'Plaine Corail Airport'

function normalizeLocalizedText<T extends LocalizedText>(
  value: T,
  normalizer: (input: string) => string,
): T {
  if (typeof value === 'string') {
    return normalizer(value) as T
  }

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return value
  }

  let changed = false
  const normalizedEntries = Object.entries(value).map(([key, entry]) => {
    if (typeof entry !== 'string') {
      return [key, entry] as const
    }

    const normalizedEntry = normalizer(entry)
    if (normalizedEntry !== entry) {
      changed = true
    }

    return [key, normalizedEntry] as const
  })

  if (!changed) {
    return value
  }

  return Object.fromEntries(normalizedEntries) as T
}

function normalizeAirportName<T extends LocalizedText>(value: T): T {
  return normalizeLocalizedText(value, (input) => {
    return LEGACY_AIRPORT_NAME_PATTERN.test(input.trim()) ? MODERN_AIRPORT_NAME : input
  })
}

function normalizePhysicalAddress<T extends LocalizedText>(value: T): T {
  return normalizeLocalizedText(value, (input) => {
    return input.replace(LEGACY_AIRPORT_ADDRESS_PATTERN, MODERN_AIRPORT_NAME)
  })
}

export function normalizeSiteSettings<
  T extends {
    airportName?: LocalizedText
    physicalAddress?: LocalizedText
  },
>(settings: T): T {
  const airportName = normalizeAirportName(settings.airportName)
  const physicalAddress = normalizePhysicalAddress(settings.physicalAddress)

  if (
    airportName === settings.airportName &&
    physicalAddress === settings.physicalAddress
  ) {
    return settings
  }

  return {
    ...settings,
    airportName,
    physicalAddress,
  }
}
