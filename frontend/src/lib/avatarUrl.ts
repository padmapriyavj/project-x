/**
 * DiceBear avatars via HTTP API (PRD §8.1).
 * @see https://www.dicebear.com/guides/use-the-http-api/
 */
const DICEBEAR_BASE = 'https://api.dicebear.com/9.x'

export type AvatarStyle = 'avataaars' | 'bottts' | 'lorelei'

export function dicebearAvatarUrl(
  style: AvatarStyle,
  seed: string,
  options?: Record<string, string>,
): string {
  const params = new URLSearchParams({ seed, ...options })
  return `${DICEBEAR_BASE}/${style}/svg?${params.toString()}`
}
