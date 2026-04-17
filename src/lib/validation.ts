import { z } from 'zod'

function isSafePathname(path: string): boolean {
  if (path.includes('//') || path.includes('?') || path.includes('#')) {
    return false
  }

  return path
    .split('/')
    .every((segment) => segment !== '.' && segment !== '..')
}

function pathnameSchema(maxLength: number) {
  return z
    .string()
    .startsWith('/')
    .max(maxLength)
    .refine(isSafePathname, { message: 'Invalid path' })
}

export const revalidateSchema = z.object({
  paths: z.array(pathnameSchema(500)).min(1).max(50),
})

export const trackEventSchema = z.object({
  type: z.enum(['pageview']),
  path: pathnameSchema(500),
  referrer: z.string().max(2000).optional(),
  locale: z.enum(['en', 'fr', 'mfe']).optional(),
})

export const flightBoardQuerySchema = z.object({
  type: z.enum(['arrivals', 'departures']).default('arrivals'),
})
