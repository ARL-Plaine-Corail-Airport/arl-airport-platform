export function statusBadgeClass(remarks: string): string {
  const r = (remarks ?? '').toLowerCase()
  if (r.includes('on time')) return 'badge-on-time'
  if (r.includes('delayed')) return 'badge-delayed'
  if (r.includes('cancelled') || r.includes('canceled')) return 'badge-cancelled'
  if (r.includes('landed')) return 'badge-landed'
  if (r.includes('departed')) return 'badge-departed'
  return 'badge-scheduled'
}

export function statusBadgeLabel(
  remarks: string,
  t: (key: string) => string,
): string {
  if (!remarks) return t('flights.scheduled')
  const r = remarks.toLowerCase()
  if (r.includes('on time')) return t('flights.on_time')
  if (r.includes('delayed')) return t('flights.delayed')
  if (r.includes('cancelled') || r.includes('canceled')) return t('flights.cancelled')
  if (r.includes('landed')) return t('flights.landed')
  if (r.includes('departed')) return t('flights.departed')
  return remarks
}
