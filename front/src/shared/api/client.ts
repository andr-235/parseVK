export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api/v1'

let accessToken: string | null = null

export function setAccessToken(token: string | null) {
  accessToken = token
}

export function getAccessToken(): string | null {
  return accessToken
}

function headers(extra?: Record<string, string>): Record<string, string> {
  const h: Record<string, string> = {
    'Content-Type': 'application/json',
    ...extra,
  }
  if (accessToken) h['Authorization'] = `Bearer ${accessToken}`
  return h
}

let isRefreshing = false
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = []

function processQueue(err: unknown, token: string | null = null) {
  failedQueue.forEach((prom) => {
    if (err) prom.reject(err)
    else prom.resolve(token!)
  })
  failedQueue = []
}

function getCsrfToken(): string {
  const name = 'csrf_token'
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : ''
}

let _onUnauthorized: (() => void) | null = null

export function setOnUnauthorized(cb: () => void) {
  _onUnauthorized = cb
}

async function tryRefreshToken(): Promise<string | null> {
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': getCsrfToken(),
      },
      credentials: 'include',
    })
    if (!res.ok) return null
    const data = await res.json()
    const newToken = data.accessToken as string
    setAccessToken(newToken)
    const storage = sessionStorage.getItem('accessToken') ? sessionStorage : localStorage
    storage.setItem('accessToken', newToken)
    return newToken
  } catch {
    return null
  }
}

function flushAuth() {
  setAccessToken(null)
  sessionStorage.removeItem('accessToken')
  localStorage.removeItem('accessToken')
  _onUnauthorized?.()
}

async function resolveWithRefreshedToken<T>(url: string, options: RequestInit): Promise<T> {
  if (isRefreshing) {
    const newToken = await new Promise<string>((resolve, reject) => {
      failedQueue.push({ resolve, reject })
    })
    setAccessToken(newToken)
    const newOptions = {
      ...options,
      headers: {
        ...(options.headers as Record<string, string>),
        Authorization: `Bearer ${newToken}`,
      },
    }
    const res = await fetch(url, newOptions)
    if (!res.ok) throw new ApiError(res.status, await res.text())
    if (res.status === 204) return undefined as T
    return res.json()
  }

  isRefreshing = true
  try {
    const newToken = await tryRefreshToken()
    if (newToken) {
      processQueue(null, newToken)
      const newOptions = {
        ...options,
        headers: {
          ...(options.headers as Record<string, string>),
          Authorization: `Bearer ${newToken}`,
        },
      }
      const res = await fetch(url, newOptions)
      if (!res.ok) throw new ApiError(res.status, await res.text())
      if (res.status === 204) return undefined as T
      return res.json()
    }
    processQueue(new Error('Refresh failed'))
    flushAuth()
    throw new ApiError(401, 'Сессия истекла. Войдите заново.')
  } finally {
    isRefreshing = false
  }
}

async function apiFetch<T>(url: string, options: RequestInit): Promise<T> {
  const res = await fetch(url, options)
  if (res.status === 401) {
    return resolveWithRefreshedToken<T>(url, options)
  }
  if (!res.ok) throw new ApiError(res.status, await res.text())
  if (res.status === 204) return undefined as T
  return res.json()
}

async function apiFetchBlob(url: string, options: RequestInit): Promise<Blob> {
  const res = await fetch(url, options)
  if (res.status === 401) {
    const newToken = await tryRefreshToken()
    if (newToken) {
      const newOptions = {
        ...options,
        headers: {
          ...(options.headers as Record<string, string>),
          Authorization: `Bearer ${newToken}`,
        },
      }
      const retryRes = await fetch(url, newOptions)
      if (!retryRes.ok) throw new ApiError(retryRes.status, await retryRes.text())
      return retryRes.blob()
    }
    flushAuth()
    throw new ApiError(401, 'Сессия истекла. Войдите заново.')
  }
  if (!res.ok) throw new ApiError(res.status, await res.text())
  return res.blob()
}

export async function apiGet<T>(path: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`, window.location.origin)
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined) url.searchParams.set(k, String(v))
    }
  }
  return apiFetch<T>(url.toString(), { headers: headers() })
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return apiFetch<T>(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: headers(),
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
  })
}

export async function apiPostMultipart<T>(path: string, formData: FormData): Promise<T> {
  const h = headers()
  delete h['Content-Type']
  return apiFetch<T>(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: h,
    credentials: 'include',
    body: formData,
  })
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  return apiFetch<T>(`${BASE_URL}${path}`, {
    method: 'PATCH',
    headers: headers(),
    credentials: 'include',
    body: JSON.stringify(body),
  })
}

export async function apiDelete<T>(path: string): Promise<T> {
  return apiFetch<T>(`${BASE_URL}${path}`, {
    method: 'DELETE',
    headers: headers(),
    credentials: 'include',
  })
}

export async function apiGetBlob(path: string): Promise<Blob> {
  return apiFetchBlob(`${BASE_URL}${path}`, {
    headers: headers(),
    credentials: 'include',
  })
}
