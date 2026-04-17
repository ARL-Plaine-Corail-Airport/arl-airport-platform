'use client'

import Link from 'next/link'

import { formatDateTime } from '@/lib/date'
import { useI18n } from '@/i18n/provider'

type NoticeProps = {
  notice: {
    id: string
    slug: string
    title: string
    summary?: string | null
    category?: string | null
    urgent?: boolean | null
    pinned?: boolean | null
    publishedAt?: string | null
  }
}

export function NoticeCard({ notice }: NoticeProps) {
  const { t, localePath: lp, locale } = useI18n()

  return (
    <Link href={lp(`/notices/${notice.slug}`)} className="card notice-card">
      <div className="notice-card__meta">
        {notice.category && (
          <span className="pill">{t('notice_categories.' + notice.category) !== 'notice_categories.' + notice.category ? t('notice_categories.' + notice.category) : notice.category}</span>
        )}
        {notice.urgent && <span className="pill pill--danger">{t('labels.urgent')}</span>}
        {notice.pinned && (
          <span className="notice-card__pinned">{t('labels.pinned')}</span>
        )}
      </div>

      <h3 className="notice-card__title">
        {notice.title}
      </h3>

      {notice.summary && (
        <p className="notice-card__summary">
          {notice.summary}
        </p>
      )}

      {notice.publishedAt && (
        <p className="notice-card__date">{formatDateTime(notice.publishedAt, locale)}</p>
      )}
    </Link>
  )
}
