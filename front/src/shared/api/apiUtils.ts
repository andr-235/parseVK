import { refreshAccessToken } from '@/modules/auth'
import { useAuthStore } from '@/modules/auth/store'

type QueryParams = Record<string, string | number | boolean | undefined | null>
interface ApiRequestOptions extends RequestInit {
  skipAuth?: boolean
  skipRefresh?: boolean
}

export function buildQueryString(params: QueryParams): string {
  const searchParams = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      searchParams.set(key, String(value))
    }
  }

  return searchParams.toString()
}

export async function handleResponse<T>(response: Response, defaultError?: string): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text().catch(() => null)
    throw new Error(errorText || defaultError || 'Request failed')
  }

  return response.json() as Promise<T>
}

export async function createRequest(
  url: string,
  options: ApiRequestOptions = {}
): Promise<Response> {
  const { skipAuth, skipRefresh, ...fetchOptions } = options
  const headers = new Headers(fetchOptions.headers ?? {})
  const body = fetchOptions.body
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData

  if (!isFormData && body != null && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  if (!skipAuth) {
    const token = useAuthStore.getState().accessToken
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`)
    }
  }

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
  })

  if (response.status !== 401 || skipRefresh || skipAuth) {
    return response
  }

  const refreshed = await refreshAccessToken()
  if (!refreshed) {
    return response
  }

  const retryHeaders = new Headers(headers)
  retryHeaders.set('Authorization', `Bearer ${refreshed}`)

  return fetch(url, {
    ...fetchOptions,
    headers: retryHeaders,
  })
}
