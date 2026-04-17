import 'server-only'

import { Buffer } from 'node:buffer'
import { timingSafeEqual } from 'crypto'

import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

import { serverEnv } from '@/lib/env.server'
import { revalidateSchema } from '@/lib/validation'

function safeCompare(a: string, b: string): boolean {
  const left = Buffer.from(a, 'utf8')
  const right = Buffer.from(b, 'utf8')

  if (left.length !== right.length) {
    return false
  }

  return timingSafeEqual(left, right)
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
