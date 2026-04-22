// =============================================================================
// Upload Helpers
//
// Shared utilities for Payload collection upload hooks (Media, Documents).
// =============================================================================

export function getUploadSize(file: unknown): number | null {
  if (!file || typeof file !== 'object') return null
  const size = (file as { size?: unknown }).size
  return typeof size === 'number' && Number.isFinite(size) ? size : null
}

export function formatMegabytes(bytes: number): string {
  return `${Math.round(bytes / (1024 * 1024))}MB`
}
