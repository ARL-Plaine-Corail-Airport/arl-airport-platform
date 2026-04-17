export class BuildTimeDbDisabledError extends Error {
  constructor(message = 'Database access is disabled during build.') {
    super(message)
    this.name = 'BuildTimeDbDisabledError'
  }
}

export function shouldSkipDbDuringBuild() {
  return process.env.ARL_SKIP_DB_DURING_BUILD === '1'
}

export function isBuildTimeDbDisabledError(error: unknown): error is BuildTimeDbDisabledError {
  return (
    error instanceof BuildTimeDbDisabledError ||
    (typeof error === 'object' &&
      error !== null &&
      'name' in error &&
      error.name === 'BuildTimeDbDisabledError')
  )
}
