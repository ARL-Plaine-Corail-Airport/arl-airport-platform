import type { CollectionConfig } from 'payload'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Documents } from '@/collections/Documents'
import { MAX_FILE_SIZES } from '@/lib/storage/buckets'

function getBeforeChangeHook(collection: CollectionConfig) {
  const hook = collection.hooks?.beforeChange?.[0]
  expect(typeof hook).toBe('function')
  return hook as NonNullable<typeof hook>
}

function buildPdfBuffer({
  withTrailer = true,
  padBytes = 0,
}: { withTrailer?: boolean; padBytes?: number } = {}) {
  const header = Buffer.from('%PDF-1.7\n')
  const padding = Buffer.alloc(padBytes, 0x20)
  const trailer = withTrailer ? Buffer.from('\n%%EOF\n') : Buffer.alloc(0)
  return Buffer.concat([header, padding, trailer])
}

async function runDocumentsBeforeChange(input: {
  file?: unknown
  operation: 'create' | 'update'
  data?: Record<string, unknown>
  user?: { id: number } | null
}) {
  return await getBeforeChangeHook(Documents)({
    data: input.data ?? {},
    operation: input.operation,
    req: {
      file: input.file,
      user: input.user === undefined ? { id: 7 } : input.user,
    },
  } as any)
}

describe('Documents upload validation', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.useRealTimers()
  })

  it('rejects creates when the uploaded file body is missing', async () => {
    await expect(
      runDocumentsBeforeChange({
        file: undefined,
        operation: 'create',
      }),
    ).rejects.toThrow('Uploaded document is not a valid PDF file.')
  })

  it('rejects creates when uploaded file data is not a Buffer', async () => {
    await expect(
      runDocumentsBeforeChange({
        file: { data: '%PDF-1.7', size: 8 },
        operation: 'create',
      }),
    ).rejects.toThrow('Uploaded document is not a valid PDF file.')
  })

  it('rejects creates when the PDF trailer %%EOF is missing', async () => {
    await expect(
      runDocumentsBeforeChange({
        file: {
          data: buildPdfBuffer({ withTrailer: false }),
          size: 128,
        },
        operation: 'create',
      }),
    ).rejects.toThrow('Uploaded document is not a valid PDF file.')
  })

  it('allows metadata-only updates without a file upload', async () => {
    await expect(
      runDocumentsBeforeChange({
        file: undefined,
        operation: 'update',
      }),
    ).resolves.toEqual({})
  })

  it('accepts a valid PDF buffer and stamps audit fields on create', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-20T10:00:00.000Z'))

    const buffer = buildPdfBuffer()
    const result = await runDocumentsBeforeChange({
      file: { data: buffer, size: buffer.byteLength },
      operation: 'create',
    })

    expect(result).toMatchObject({
      uploadedAt: '2026-04-20T10:00:00.000Z',
      uploadedBy: 7,
    })
  })

  it('does not overwrite uploadedAt on update when a file is supplied', async () => {
    const buffer = buildPdfBuffer()
    const result = await runDocumentsBeforeChange({
      file: { data: buffer, size: buffer.byteLength },
      operation: 'update',
      data: { uploadedAt: '2026-01-01T00:00:00.000Z', uploadedBy: 3 },
    })

    expect(result).toMatchObject({
      uploadedAt: '2026-01-01T00:00:00.000Z',
      uploadedBy: 3,
    })
  })

  it('rejects uploads that exceed the PDF size limit', async () => {
    const buffer = Buffer.alloc(0)
    await expect(
      runDocumentsBeforeChange({
        file: { data: buffer, size: MAX_FILE_SIZES.pdf + 1 },
        operation: 'create',
      }),
    ).rejects.toThrow(/exceeds the \d+MB limit/)
  })

  it('refuses creates without an authenticated user in production', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const buffer = buildPdfBuffer()
    await expect(
      runDocumentsBeforeChange({
        file: { data: buffer, size: buffer.byteLength },
        operation: 'create',
        user: null,
      }),
    ).rejects.toThrow('Documents must be created by an authenticated user.')
  })
})
