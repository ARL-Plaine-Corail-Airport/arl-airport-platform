'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

import { useI18n } from '@/i18n/provider'

interface FilterChipsProps {
  paramName: string
  basePath: string
  options: Array<{ value: string; label: string }>
}

export function FilterChips({ paramName, basePath, options }: FilterChipsProps) {
  const searchParams = useSearchParams()
  const { t, localePath: lp } = useI18n()
  const active = searchParams.get(paramName) ?? ''

  return (
    <div className="filter-chips" role="group" aria-label="Filter">
      <Link
        href={lp(basePath)}
        className={`filter-chip${!active ? ' filter-chip--active' : ''}`}
        scroll={false}
      >
        {t('labels.all')}
      </Link>
      {options.map((opt) => (
        <Link
          key={opt.value}
          href={lp(`${basePath}?${paramName}=${encodeURIComponent(opt.value)}`)}
          className={`filter-chip${active === opt.value ? ' filter-chip--active' : ''}`}
          scroll={false}
        >
          {opt.label}
        </Link>
      ))}
    </div>
  )
}
