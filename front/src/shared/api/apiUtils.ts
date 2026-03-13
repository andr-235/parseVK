import { refreshAccessToken } from '@/modules/auth'
import { useAuthStore } from '@/modules/auth'

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
    const parsedError = tryExtractErrorMessage(errorText)
    throw new Error(parsedError || defaultError || 'Не удалось выполнить запрос')
  }

  return response.json() as Promise<T>
}

function tryExtractErrorMessage(payload: string | null): string | null {
  if (!payload) {
    return null
  }

  try {
    const parsed = JSON.parse(payload) as { message?: unknown }
    if (typeof parsed.message === 'string' && parsed.message.trim()) {
      return parsed.message.trim()
    }
    if (Array.isArray(parsed.message)) {
      const firstMessage = parsed.message.find(
        (entry): entry is string => typeof entry === 'string' && entry.trim().length > 0
      )
      if (firstMessage) {
        return firstMessage.trim()
      }
    }
  } catch {
    return payload.trim() || null
  }

  return payload.trim() || null
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
