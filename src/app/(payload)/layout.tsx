import React from 'react'

import '@payloadcms/next/css'
import '@/styles/tokens.css'
import '@/payload-admin-shell.css'
import config from '@payload-config'
import { handleServerFunctions, RootLayout } from '@payloadcms/next/layouts'
import type { ServerFunctionClient } from 'payload'

import { importMap } from '@/app/(payload)/admin/importMap.js'

type Args = {
  children: React.ReactNode
}

export default async function Layout({ children }: Args) {
  const serverFunction: ServerFunctionClient = async function (args) {
    'use server'
    return handleServerFunctions({
      ...args,
      config,
      importMap,
    })
  }

  return (
    <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
      {children}
    </RootLayout>
  )
}
