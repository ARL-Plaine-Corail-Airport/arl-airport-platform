import type { NextRequest } from 'next/server'

const IPV4_PATTERN =
  /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/i

function isValidIPv6(rawIp: string): boolean {
  if (rawIp.length < 3 || rawIp.length > 39) return false
  if (!/^[a-f0-9:]+$/i.test(rawIp)) return false
  if (!rawIp.includes(':')) return false
  if (!/[a-f0-9]/i.test(rawIp)) return false
  if (rawIp.includes(':::')) return false

  const compressedMarkerCount = rawIp.match(/::/g)?.length ?? 0
  if (compressedMarkerCount > 1) return false

  const segments = rawIp.split(':')
  if (segments.length > 8) return false

  return segments.every((segment) =>
    segment === '' || /^[a-f0-9]{1,4}$/i.test(segment),
  )
}

function isValidIp(rawIp: string): boolean {
  return IPV4_PATTERN.test(rawIp) || isValidIPv6(rawIp)
}

export function getRateLimitKey(
  request: NextRequest,
  normalizedPathname?: string,
): string {
  const rawIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? request.headers.get('x-real-ip')?.trim()

  if (rawIp && isValidIp(rawIp)) {
    return rawIp
  }

  // In production, trust the reverse-proxy-provided IP only; a missing IP means
  // either a misconfigured proxy or an attacker, and must not be given its own bucket.
  if (process.env.NODE_ENV === 'production') {
    return 'anon:no-ip'
  }

  const fingerprintParts = [
    request.method,
    normalizedPathname,
    request.headers.get('user-agent')?.trim() ?? '',
    request.headers.get('accept-language')?.trim() ?? '',
    request.headers.get('accept')?.trim() ?? '',
    request.headers.get('sec-ch-ua')?.trim() ?? '',
    request.headers.get('sec-fetch-site')?.trim() ?? '',
  ].filter((part): part is string => Boolean(part))

  return `anon:${fingerprintParts.join(':')}`
}
