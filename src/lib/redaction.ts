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
const STRUCTURED_SECRET_KEYS = [
  'api_key',
  'apikey',
  'apiKey',
  'access_token',
  'refresh_token',
  'secret',
  'signature',
]
const SECRET_LIKE_VALUE = '[A-Za-z0-9+/_=.-]{20,}'

const QUERY_VALUE_PATTERN = new RegExp(
  `(^|[?&])((?:${SENSITIVE_QUERY_KEYS.join('|')})=)([^&#\\s]+)`,
  'gi',
)
const STRUCTURED_VALUE_PATTERN = new RegExp(
  `(["']?(?:${STRUCTURED_SECRET_KEYS.join('|')})["']?\\s*[:=]\\s*["']?)(${SECRET_LIKE_VALUE})(["']?)`,
  'gi',
)
const JWT_LIKE_VALUE_PATTERN =
  /(^|[^A-Za-z0-9+/_=.-])([A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,})(?=$|[^A-Za-z0-9+/_=.-])/g

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function buildExplicitSecretPattern(secrets: string[]): RegExp | null {
  const escapedSecrets = secrets
    .filter((secret) => secret.length >= 4)
    .sort((a, b) => b.length - a.length)
    .map(escapeRegExp)

  return escapedSecrets.length > 0
    ? new RegExp(escapedSecrets.join('|'), 'g')
    : null
}

export function redactSensitiveText(value: string, secrets: string[] = []): string {
  let redacted = value
    .replace(QUERY_VALUE_PATTERN, '$1$2[REDACTED]')
    .replace(STRUCTURED_VALUE_PATTERN, '$1[REDACTED]$3')
    .replace(JWT_LIKE_VALUE_PATTERN, '$1[REDACTED]')

  const secretPattern = buildExplicitSecretPattern(secrets)
  if (secretPattern) {
    redacted = redacted.replace(secretPattern, '[REDACTED]')
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
