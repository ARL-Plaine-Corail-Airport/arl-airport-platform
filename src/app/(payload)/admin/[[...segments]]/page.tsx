import type { Metadata } from 'next'

import config from '@payload-config'
import { RootPage, generatePageMetadata } from '@payloadcms/next/views'
import { importMap } from '@/app/(payload)/admin/importMap.js'

type Args = {
  params: Promise<{ segments?: string[] }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

const normalizeParams = async (paramsPromise: Args['params']) => {
  const params = await paramsPromise

  if (Array.isArray(params.segments) && params.segments.length > 0) {
    return {
      segments: params.segments,
    }
  }

  // Preserve the root /admin shape expected by Payload's RootPage.
  return {} as { segments: string[] }
}

const normalizeSearchParams = async (searchParamsPromise: Args['searchParams']) => {
  const searchParams = await searchParamsPromise

  return Object.fromEntries(
    Object.entries(searchParams).filter(([, value]) => value !== undefined),
  ) as { [key: string]: string | string[] }
}

export async function generateMetadata({ params, searchParams }: Args): Promise<Metadata> {
  return generatePageMetadata({
    config,
    params: normalizeParams(params),
    searchParams: normalizeSearchParams(searchParams),
  })
}

const Page = async ({ params, searchParams }: Args) => {
  return RootPage({
    config,
    importMap,
    params: normalizeParams(params),
    searchParams: normalizeSearchParams(searchParams),
  })
}

export default Page
