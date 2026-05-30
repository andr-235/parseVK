import { ApiError, NetworkError } from './errors'
import type { AuthProvider } from './authProvider'

type QueryParams = Record<string, string | number | boolean | undefined | null>

function buildQueryString(params: QueryParams): string {
  const searchParams = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      searchParams.set(key, String(value))
    }
  }
  return searchParams.toString()
}

function tryExtractErrorMessage(payload: string | null): string | null {
  if (!payload) return null
  try {
    const parsed = JSON.parse(payload) as { message?: unknown }
    if (typeof parsed.message === 'string' && parsed.message.trim()) return parsed.message.trim()
    if (Array.isArray(parsed.message)) {
      const first = parsed.message.find((m): m is string => typeof m === 'string' && m.trim().length > 0)
      if (first) return first.trim()
    }
  } catch {
    return payload.trim() || null
  }
  return payload.trim() || null
}

function tryParse(payload: string): unknown {
  try { return JSON.parse(payload) } catch { return payload }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.text().catch(() => null)
    const message = tryExtractErrorMessage(body)
    throw new ApiError(message || 'Request failed', response.status, body ? tryParse(body) : null)
  }
  return response.json() as Promise<T>
}

export interface ApiClient {
  get<T>(path: string, params?: QueryParams): Promise<T>
  post<T>(path: string, body?: unknown): Promise<T>
  put<T>(path: string, body?: unknown): Promise<T>
  patch<T>(path: string, body?: unknown): Promise<T>
  delete<T>(path: string): Promise<T>
  raw(path: string, options?: RequestInit): Promise<Response>
}

export function createApiClient(baseUrl: string, auth?: AuthProvider): ApiClient {
  const buildUrl = (path: string, params?: QueryParams): string => {
    const url = `${baseUrl}${path}`
    if (!params) return url
    const qs = buildQueryString(params)
    return qs ? `${url}?${qs}` : url
  }

  const request = async <T>(path: string, options: RequestInit = {}, params?: QueryParams): Promise<T> => {
    const url = buildUrl(path, params)
    const headers = new Headers(options.headers as Record<string, string> ?? {})
    const body = options.body
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData

    if (!isFormData && body != null && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json')
    }

    if (auth) {
      const token = auth.getAccessToken()
      if (token && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`)
      }
    }

    let response: Response
    try {
      response = await fetch(url, { ...options, headers })
    } catch (cause) {
      throw new NetworkError(cause)
    }

    if (response.status === 401 && auth) {
      const newToken = await auth.refreshAccessToken()
      if (newToken) {
        const retryHeaders = new Headers(headers)
        retryHeaders.set('Authorization', `Bearer ${newToken}`)
        try {
          const retryResponse = await fetch(url, { ...options, headers: retryHeaders })
          return handleResponse<T>(retryResponse)
        } catch (cause) {
          throw new NetworkError(cause)
        }
      }
    }

    return handleResponse<T>(response)
  }

  return {
    get: <T>(path: string, params?: QueryParams) =>
      request<T>(path, { method: 'GET' }, params),
    post: <T>(path: string, body?: unknown) =>
      request<T>(path, { method: 'POST', body: body != null ? JSON.stringify(body) : undefined }),
    put: <T>(path: string, body?: unknown) =>
      request<T>(path, { method: 'PUT', body: body != null ? JSON.stringify(body) : undefined }),
    patch: <T>(path: string, body?: unknown) =>
      request<T>(path, { method: 'PATCH', body: body != null ? JSON.stringify(body) : undefined }),
    delete: <T>(path: string) =>
      request<T>(path, { method: 'DELETE' }),
    raw: (path: string, options?: RequestInit) => {
      const url = `${baseUrl}${path}`
      return fetch(url, options ?? {})
    },
  }
}
