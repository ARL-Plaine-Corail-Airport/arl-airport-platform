import type { CollectionConfig } from 'payload'

import { isAdmin } from '@/access'

export const PageViews: CollectionConfig = {
  slug: 'page-views',
  access: {
    // Create is admin-only via REST API. The /api/track route uses
    // Payload's Local API (which bypasses access control) so public
    // tracking still works, but direct POST to /api/page-views is blocked.
    create: isAdmin,
    read: isAdmin,
    update: () => false,
    delete: isAdmin,
  },
  admin: {
    group: 'System',
    description: 'Anonymized page view events for internal analytics.',
    defaultColumns: ['path', 'referrer', 'device', 'createdAt'],
  },
  fields: [
    {
      name: 'path',
      type: 'text',
      required: true,
      index: true,
      maxLength: 2048,
      admin: { description: 'URL path (e.g. /arrivals)' },
    },
    {
      name: 'referrer',
      type: 'text',
      maxLength: 2048,
      admin: { description: 'Referrer domain (e.g. google.com)' },
    },
    {
      name: 'device',
      type: 'select',
      defaultValue: 'desktop',
      options: [
        { label: 'Desktop', value: 'desktop' },
        { label: 'Mobile', value: 'mobile' },
        { label: 'Tablet', value: 'tablet' },
      ],
    },
    {
      name: 'language',
      type: 'text',
      maxLength: 10,
      admin: { description: 'Browser accept-language (first tag, e.g. en)' },
    },
    {
      name: 'visitorHash',
      type: 'text',
      index: true,
      maxLength: 64,
      admin: { description: 'Daily anonymized visitor hash (SHA-256 of IP + date). Not reversible.' },
    },
  ],
}
