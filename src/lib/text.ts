export const splitParagraphs = (body?: string | null) => {
  if (!body) return []
  return body
    .split(/\n{2,}/g)
    .map((part) => part.trim())
    .filter(Boolean)
}
