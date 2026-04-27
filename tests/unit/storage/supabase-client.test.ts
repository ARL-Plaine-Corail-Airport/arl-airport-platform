import { afterEach, describe, expect, it, vi } from 'vitest'

const { createClient, loggerError } = vi.hoisted(() => ({
  createClient: vi.fn(),
  loggerError: vi.fn(),
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient,
}))

vi.mock('@/lib/logger', () => ({
  logger: {
    error: loggerError,
  },
}))

function createStorageMock() {
  const createSignedUrl = vi.fn()
  const createSignedUrls = vi.fn()
  const remove = vi.fn()
  const from = vi.fn(() => ({
    createSignedUrl,
    createSignedUrls,
    remove,
  }))
  const client = {
    storage: {
      from,
    },
  }

  return {
    client,
    createSignedUrl,
    createSignedUrls,
    from,
    remove,
  }
}

async function loadSubject(storage = createStorageMock()) {
  vi.resetModules()
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://supabase.example.com')
  vi.stubEnv('SUPABASE_URL', undefined)
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-role-key')

  createClient.mockReset()
  createClient.mockReturnValue(storage.client)
  loggerError.mockReset()

  const subject = await import('@/lib/storage/supabase-client')

  return {
    ...subject,
    createClient,
    loggerError,
    storage,
  }
}

describe('supabase storage client', () => {
  afterEach(() => {
    vi.resetModules()
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
    createClient.mockReset()
    loggerError.mockReset()
  })

  it('returns a singleton Supabase admin client', async () => {
    const { createClient, getSupabaseAdminClient } = await loadSubject()

    const first = getSupabaseAdminClient()
    const second = getSupabaseAdminClient()

    expect(first).toBe(second)
    expect(createClient).toHaveBeenCalledTimes(1)
    expect(createClient).toHaveBeenCalledWith(
      'https://supabase.example.com',
      'service-role-key',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    )
  })

  it('prefers the server-side runtime Supabase URL when configured', async () => {
    const { createClient, getSupabaseAdminClient } = await loadSubject()
    vi.stubEnv('SUPABASE_URL', 'https://runtime-supabase.example.com')

    getSupabaseAdminClient()

    expect(createClient).toHaveBeenCalledWith(
      'https://runtime-supabase.example.com',
      'service-role-key',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    )
  })

  it('generates a signed URL on success', async () => {
    const storage = createStorageMock()
    storage.createSignedUrl.mockResolvedValue({
      data: { signedUrl: 'https://signed.example/file.pdf' },
      error: null,
    })
    const { getSignedURL } = await loadSubject(storage)

    await expect(getSignedURL('docs', 'file.pdf')).resolves.toBe(
      'https://signed.example/file.pdf',
    )
    expect(storage.from).toHaveBeenCalledWith('docs')
    expect(storage.createSignedUrl).toHaveBeenCalledWith('file.pdf', 3600)
  })

  it('passes a custom signed URL expiry', async () => {
    const storage = createStorageMock()
    storage.createSignedUrl.mockResolvedValue({
      data: { signedUrl: 'https://signed.example/file.pdf' },
      error: null,
    })
    const { getSignedURL } = await loadSubject(storage)

    await getSignedURL('docs', 'file.pdf', 120)

    expect(storage.createSignedUrl).toHaveBeenCalledWith('file.pdf', 120)
  })

  it('throws when Supabase cannot generate a signed URL', async () => {
    const storage = createStorageMock()
    storage.createSignedUrl.mockResolvedValue({
      data: null,
      error: { message: 'not found' },
    })
    const { getSignedURL } = await loadSubject(storage)

    await expect(getSignedURL('docs', 'missing.pdf')).rejects.toThrow(
      'Failed to generate signed URL for docs/missing.pdf',
    )
  })

  it('throws SignedUrlTimeoutError when Supabase does not respond within 10s', async () => {
    const storage = createStorageMock()
    storage.createSignedUrl.mockImplementation(
      () => new Promise(() => {}),
    )
    vi.useFakeTimers()
    try {
      const { getSignedURL, SignedUrlTimeoutError } = await loadSubject(storage)
      const pending = getSignedURL('docs', 'slow.pdf')
      const assertion = expect(pending).rejects.toBeInstanceOf(SignedUrlTimeoutError)
      await vi.advanceTimersByTimeAsync(10_001)
      await assertion
    } finally {
      vi.useRealTimers()
    }
  })

  it('throws SignedUrlTimeoutError when batch signed URLs do not respond within 10s', async () => {
    const storage = createStorageMock()
    storage.createSignedUrls.mockImplementation(
      () => new Promise(() => {}),
    )
    vi.useFakeTimers()
    try {
      const { getSignedURLs, SignedUrlTimeoutError } = await loadSubject(storage)
      const pending = getSignedURLs('docs', ['slow.pdf'])
      const assertion = expect(pending).rejects.toBeInstanceOf(SignedUrlTimeoutError)
      await vi.advanceTimersByTimeAsync(10_001)
      await assertion
    } finally {
      vi.useRealTimers()
    }
  })

  it('batch-generates signed URLs as a path map', async () => {
    const storage = createStorageMock()
    storage.createSignedUrls.mockResolvedValue({
      data: [
        { path: 'one.pdf', signedUrl: 'https://signed.example/one.pdf' },
        { path: 'two.pdf', signedUrl: 'https://signed.example/two.pdf' },
      ],
      error: null,
    })
    const { getSignedURLs } = await loadSubject(storage)

    await expect(getSignedURLs('docs', ['one.pdf', 'two.pdf'])).resolves.toEqual({
      'one.pdf': 'https://signed.example/one.pdf',
      'two.pdf': 'https://signed.example/two.pdf',
    })
    expect(storage.createSignedUrls).toHaveBeenCalledWith(
      ['one.pdf', 'two.pdf'],
      3600,
    )
  })

  it('drops failed entries from mixed batch signed URL responses', async () => {
    const storage = createStorageMock()
    storage.createSignedUrls.mockResolvedValue({
      data: [
        { path: 'one.pdf', signedUrl: 'https://signed.example/one.pdf' },
        { path: 'two.pdf', signedUrl: null },
      ],
      error: null,
    })
    const { getSignedURLs } = await loadSubject(storage)

    await expect(getSignedURLs('docs', ['one.pdf', 'two.pdf'])).resolves.toEqual({
      'one.pdf': 'https://signed.example/one.pdf',
    })
  })

  it('returns an empty map for an empty batch response', async () => {
    const storage = createStorageMock()
    storage.createSignedUrls.mockResolvedValue({
      data: [],
      error: null,
    })
    const { getSignedURLs } = await loadSubject(storage)

    await expect(getSignedURLs('docs', [])).resolves.toEqual({})
  })

  it('deletes a storage object by bucket and path', async () => {
    const storage = createStorageMock()
    storage.remove.mockResolvedValue({ error: null })
    const { deleteStorageObject } = await loadSubject(storage)

    await deleteStorageObject('docs', 'file.pdf')

    expect(storage.from).toHaveBeenCalledWith('docs')
    expect(storage.remove).toHaveBeenCalledWith(['file.pdf'])
  })

  it('logs delete failures without throwing', async () => {
    const storage = createStorageMock()
    const error = new Error('delete failed')
    storage.remove.mockResolvedValue({ error })
    const { deleteStorageObject, loggerError } = await loadSubject(storage)

    await expect(deleteStorageObject('docs', 'file.pdf')).resolves.toBeUndefined()
    expect(loggerError).toHaveBeenCalledWith(
      'Failed to delete docs/file.pdf',
      error,
      'supabase-client',
    )
  })
})
