// Convert camelCase, snake_case, kebab-case, or dot.segments to Title Case
export function humanizeSegment(seg: string): string {
  if (!seg) return ''
  // Replace separators then split camelCase
  const cleaned = seg
    .replace(/[_-]+/g, ' ')
    .replace(/\./g, ' ')
  const parts: string[] = []
  cleaned.split(' ').forEach((token) => {
    if (!token) return
    const split = token.replace(/([a-z0-9])([A-Z])/g, '$1 $2').split(' ')
    parts.push(...split)
  })
  return parts
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

export function humanizePathTitle(parentKey?: string, key?: string): string {
  if (parentKey && key) return `${humanizeSegment(parentKey)} - ${humanizeSegment(key)}`
  if (key) return humanizeSegment(key)
  if (parentKey) return humanizeSegment(parentKey)
  return ''
}

