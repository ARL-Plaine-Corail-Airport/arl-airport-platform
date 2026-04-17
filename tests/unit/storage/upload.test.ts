import { beforeEach, describe, expect, it, vi } from 'vitest'

const { from, getPublicUrl, getSupabaseAdminClient, upload } = vi.hoisted(() => {
  const upload = vi.fn()
  const getPublicUrl = vi.fn()
  const from = vi.fn(() => ({
    upload,
    getPublicUrl,
  }))

  return {
    from,
    getPublicUrl,
    getSupabaseAdminClient: vi.fn(() => ({
      storage: {
        from,
      },
    })),
    upload,
  }
})

vi.mock('@/lib/storage/supabase-client', () => ({
  getSupabaseAdminClient,
}))

import {
  uploadProtectedDocument,
  uploadPublicImage,
  uploadToStorage,
  validateUpload,
} from '@/lib/storage/upload'

describe('storage upload utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    upload.mockResolvedValue({
      data: {
        path: 'images/hero/terminal.webp',
        fullPath: 'arl-public-media/images/hero/terminal.webp',
      },
      error: null,
    })
    getPublicUrl.mockReturnValue({
      data: {
        publicUrl: 'https://cdn.example.com/images/hero/terminal.webp',
      },
    })
  })

  it('validates image and PDF uploads', () => {
    expect(validateUpload('image/webp', 1024, 'image')).toEqual({ valid: true })
    expect(validateUpload('application/pdf', 2048, 'pdf')).toEqual({ valid: true })
  })

  it('rejects oversized uploads and invalid MIME types', () => {
    expect(validateUpload('image/webp', 11 * 1024 * 1024, 'image')).toEqual({
      valid: false,
      reason: 'File size 11534336 exceeds maximum 10485760 bytes for image',
    })
    expect(validateUpload('text/plain', 1024, 'pdf')).toEqual({
      valid: false,
      reason: 'MIME type "text/plain" is not permitted for pdf. Allowed: application/pdf',
    })
  })

  it('uploads public media and returns a public URL', async () => {
    const result = await uploadToStorage({
      bucket: 'arl-public-media',
      path: 'images/hero/terminal.webp',
      buffer: Buffer.from('image'),
      contentType: 'image/webp',
      cacheControl: '86400',
      upsert: true,
    })

    expect(result).toEqual({
      path: 'images/hero/terminal.webp',
      fullPath: 'arl-public-media/images/hero/terminal.webp',
      publicURL: 'https://cdn.example.com/images/hero/terminal.webp',
    })
    expect(from).toHaveBeenCalledWith('arl-public-media')
    expect(upload).toHaveBeenCalledWith('images/hero/terminal.webp', Buffer.from('image'), {
      contentType: 'image/webp',
      cacheControl: '86400',
      upsert: true,
    })
    expect(getPublicUrl).toHaveBeenCalledWith('images/hero/terminal.webp')
  })

  it('uploads protected documents without returning a public URL', async () => {
    upload.mockResolvedValue({
      data: {
        path: 'uploads/notice.pdf',
        fullPath: 'arl-protected-docs/uploads/notice.pdf',
      },
      error: null,
    })

    const result = await uploadToStorage({
      bucket: 'arl-protected-docs',
      path: 'uploads/notice.pdf',
      buffer: Buffer.from('pdf'),
      contentType: 'application/pdf',
    })

    expect(result).toEqual({
      path: 'uploads/notice.pdf',
      fullPath: 'arl-protected-docs/uploads/notice.pdf',
      publicURL: null,
    })
    expect(getPublicUrl).not.toHaveBeenCalled()
  })

  it('throws when Supabase upload fails', async () => {
    upload.mockResolvedValue({
      data: null,
      error: { message: 'upload failed' },
    })

    await expect(
      uploadToStorage({
        bucket: 'arl-public-media',
        path: 'images/hero/terminal.webp',
        buffer: Buffer.from('image'),
        contentType: 'image/webp',
      }),
    ).rejects.toThrow(
      '[upload] Failed to upload to arl-public-media/images/hero/terminal.webp: upload failed',
    )
  })

  it('wraps public image uploads with validation and storage defaults', async () => {
    await uploadPublicImage(
      Buffer.from('image'),
      'images/hero/terminal.webp',
      'image/webp',
    )

    expect(from).toHaveBeenCalledWith('arl-public-media')
    expect(upload).toHaveBeenCalledWith('images/hero/terminal.webp', Buffer.from('image'), {
      contentType: 'image/webp',
      cacheControl: '86400',
      upsert: false,
    })
  })

  it('wraps protected document uploads with validation and storage defaults', async () => {
    upload.mockResolvedValue({
      data: {
        path: 'uploads/notice.pdf',
        fullPath: 'arl-protected-docs/uploads/notice.pdf',
      },
      error: null,
    })

    await uploadProtectedDocument(Buffer.from('pdf'), 'uploads/notice.pdf')

    expect(from).toHaveBeenCalledWith('arl-protected-docs')
    expect(upload).toHaveBeenCalledWith('uploads/notice.pdf', Buffer.from('pdf'), {
      contentType: 'application/pdf',
      cacheControl: '3600',
      upsert: false,
    })
  })
})
