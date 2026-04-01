import { timingSafeEqual } from 'crypto'

import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

import { serverEnv } from '@/lib/env'

function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  return timingSafeEqual(Buffer.from(a), Buffer.from(b))
}

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-revalidate-secret') ?? ''

  if (!serverEnv.revalidateSecret || !safeCompare(secret, serverEnv.revalidateSecret)) {
    return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const paths = Array.isArray(body?.paths) ? body.paths : ['/']

  for (const path of paths) {
    revalidatePath(path)
  }

  return NextResponse.json({ ok: true, revalidated: paths })
}
