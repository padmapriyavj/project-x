import { getApiBaseUrl } from '@/lib/env'

export type ApiRequestInit = RequestInit & {
  /** When false, do not send credentials (default true for cookie auth later). */
  withCredentials?: boolean
}

/**
 * Fetch relative to `VITE_API_BASE_URL`.
 * Typed paths can use generated types from `@/lib/api/schema`.
 */
export async function apiFetch(
  path: string,
  init: ApiRequestInit = {},
): Promise<Response> {
  const base = getApiBaseUrl()
  const url = path.startsWith('http') ? path : `${base}${path.startsWith('/') ? '' : '/'}${path}`
  const { withCredentials = true, ...rest } = init
  return fetch(url, {
    ...rest,
    credentials: withCredentials ? 'include' : 'omit',
  })
}
