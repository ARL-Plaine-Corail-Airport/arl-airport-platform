// =============================================================================
// Media Collection
//
// Handles all image uploads for the airport platform.
// Storage: Supabase Storage (arl-public-media bucket) via @payloadcms/storage-s3
//
// The @payloadcms/storage-s3 plugin (configured in payload.config.ts) intercepts
// Payload's upload handler and streams files directly to Supabase Storage via
// the S3-compatible API. No local disk storage is used in production.
//
// FRONTEND PLACEMENT:
//   This collection stores shared media assets. Where an image appears on the
//   public site is controlled by explicit upload fields on pages, collections,
//   and globals that reference a media item.
//
// For protected PDF documents, use the Documents collection (Documents.ts).
// =============================================================================

import type { CollectionConfig } from 'payload'

import { isEditor } from '@/access'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true, // Public read: media is served from the public CDN bucket
    create: isEditor,
    update: isEditor,
    delete: isEditor,
  },
  admin: {
    useAsTitle: 'alt',
    defaultColumns: ['filename', 'mimeType', 'updatedAt'],
    description:
      'Images uploaded here are stored in the Supabase public media bucket and served via CDN. Placement on the public site is controlled by explicit image fields elsewhere in the CMS.',
    group: 'Assets',
  },
  upload: {
    // staticDir is intentionally omitted: @payloadcms/storage-s3 takes over.
    // Files are streamed to Supabase Storage, not written to local disk.
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
    imageSizes: [
      // Responsive sizes generated server-side and uploaded to Supabase Storage.
      { name: 'thumbnail', width: 400, height: 300, position: 'centre' },
      { name: 'card', width: 800, height: 600, position: 'centre' },
      { name: 'hero', width: 1920, height: 1080, position: 'centre' },
    ],
    adminThumbnail: 'thumbnail',
    focalPoint: true,
  },
  fields: [
    {
      name: 'alt',
      label: 'Alt Text',
      type: 'text',
      required: true,
      localized: true,
      admin: {
        description: 'Required for accessibility and SEO. Describe the image content concisely.',
      },
    },
    {
      name: 'caption',
      label: 'Caption',
      type: 'textarea',
      localized: true,
    },
    {
      name: 'mediaCategory',
      label: 'Admin Category',
      type: 'select',
      options: [
        { label: 'Hero / Banner', value: 'hero' },
        { label: 'Page Image', value: 'page' },
        { label: 'Airline Logo', value: 'airline' },
        { label: 'Staff / Management', value: 'staff' },
        { label: 'News / Event Photo', value: 'news' },
        { label: 'Amenity / Facility', value: 'amenity' },
        { label: 'Airport Map', value: 'map' },
        { label: 'General', value: 'general' },
      ],
      admin: {
        description:
          'Used only to organise media in the CMS. Frontend placement is controlled by explicit upload fields on pages, news items, airlines, and other content types.',
      },
    },
  ],
}
