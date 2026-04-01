'use client'

import Link from 'next/link'

import { formatDateTime } from '@/lib/date'
import { useI18n } from '@/i18n/provider'

export function NoticeCard({ notice }: { notice: any }) {
  const { t, localePath: lp, locale } = useI18n()

  return (
    <Link href={lp(`/notices/${notice.slug}`)} className="card" style={{ display: 'block' }}>
      <div className="notice-card__meta">
        {notice.category && (
          <span className="pill">{t('notice_categories.' + notice.category) !== 'notice_categories.' + notice.category ? t('notice_categories.' + notice.category) : notice.category}</span>
        )}
        {notice.urgent && <span className="pill pill--danger">{t('labels.urgent')}</span>}
        {notice.pinned && (
          <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 500 }}>{t('labels.pinned')}</span>
        )}
      </div>

      <h3 style={{ fontSize: '0.875rem', fontWeight: 600, lineHeight: 1.4, marginBottom: '0.5rem' }}>
        {notice.title}
      </h3>

      {notice.summary && (
        <p style={{ fontSize: '0.75rem', color: 'var(--muted)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {notice.summary}
        </p>
      )}

      {notice.publishedAt && (
        <p className="notice-card__date">{formatDateTime(notice.publishedAt, locale)}</p>
      )}
    </Link>
  )
}
