import { spawnSync } from 'node:child_process'

function getBuildVersion() {
  const sourceVersion =
    process.env.NEXT_PUBLIC_BUILD_VERSION ||
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.GITHUB_SHA ||
    process.env.COMMIT_SHA ||
    process.env.SOURCE_VERSION

  if (sourceVersion) {
    return sourceVersion.slice(0, 12)
  }

  return new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)
}

const env = {
  ...process.env,
  ARL_SKIP_DB_DURING_BUILD: '1',
  NEXT_PUBLIC_BUILD_VERSION: getBuildVersion(),
}

if (process.argv.includes('--analyze')) {
  env.ANALYZE = 'true'
}

const result = spawnSync('pnpm', ['exec', 'next', 'build'], {
  stdio: 'inherit',
  env,
  shell: process.platform === 'win32',
})

if (result.error) {
  throw result.error
}

process.exit(result.status ?? 1)
