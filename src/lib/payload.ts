import { cache } from 'react'

import config from '@payload-config'
import { getPayload } from 'payload'

import { BuildTimeDbDisabledError, shouldSkipDbDuringBuild } from '@/lib/build-db'

export const getPayloadClient = cache(async () => {
  if (shouldSkipDbDuringBuild()) {
    throw new BuildTimeDbDisabledError()
  }

  return getPayload({ config })
})
