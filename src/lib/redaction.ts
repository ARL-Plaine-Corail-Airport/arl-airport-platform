const SENSITIVE_QUERY_KEYS = [
  'api_key',
  'apikey',
  'apiKey',
  'access_token',
  'refresh_token',
  'token',
  'secret',
  'signature',
]

const QUERY_VALUE_PATTERN = new RegExp(
  `([?&](?:${SENSITIVE_QUERY_KEYS.join('|')})=)([^&#\\s]+)`,
  'gi',
)
const STRUCTURED_VALUE_PATTERN = new RegExp(
  `(["']?(?:${SENSITIVE_QUERY_KEYS.join('|')})["']?\\s*[:=]\\s*["']?)([^"',\\s&}]+)`,
  'gi',
)

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function redactSensitiveText(value: string, secrets: string[] = []): string {
  let redacted = value
    .replace(QUERY_VALUE_PATTERN, '$1[REDACTED]')
    .replace(STRUCTURED_VALUE_PATTERN, '$1[REDACTED]')

  for (const secret of secrets) {
    if (secret.length < 4) continue
    redacted = redacted.replace(new RegExp(escapeRegExp(secret), 'g'), '[REDACTED]')
  }

  return redacted
}

function redactValue(value: unknown, secrets: string[], seen: WeakSet<object>): unknown {
  if (typeof value === 'string') {
    return redactSensitiveText(value, secrets)
  }

  if (!value || typeof value !== 'object') {
    return value
  }

  if (seen.has(value)) {
    return value
  }
  seen.add(value)

  if (Array.isArray(value)) {
    return value.map((item) => redactValue(item, secrets, seen))
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key,
      SENSITIVE_QUERY_KEYS.some((sensitiveKey) => key.toLowerCase() === sensitiveKey.toLowerCase())
        ? '[REDACTED]'
        : redactValue(entry, secrets, seen),
    ]),
  )
}

export function redactSensitiveData<T>(value: T, secrets: string[] = []): T {
  return redactValue(value, secrets, new WeakSet<object>()) as T
}
