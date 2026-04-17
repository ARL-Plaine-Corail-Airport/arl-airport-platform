import 'server-only'

import { timingSafeEqual } from 'crypto'

import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

import { serverEnv } from '@/lib/env.server'
import { revalidateSchema } from '@/lib/validation'

function safeCompare(a: string, b: string): boolean {
  const maxLen = Math.max(a.length, b.length)
  const bufA = Buffer.alloc(maxLen)
  const bufB = Buffer.alloc(maxLen)
  bufA.write(a)
  bufB.write(b)
  const equal = timingSafeEqual(bufA, bufB)
  return a.length === b.length && equal
}

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-revalidate-secret') ?? ''
  const configuredSecret = serverEnv.revalidateSecret

  if (
    !configuredSecret ||
    configuredSecret.length < 16 ||
    !safeCompare(secret, configuredSecret)
  ) {
    return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const result = revalidateSchema.safeParse(body)

  if (!result.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { paths } = result.data

  for (const path of paths) {
    revalidatePath(path)
  }

  return NextResponse.json({ ok: true, revalidated: paths })
}
