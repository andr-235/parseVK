const rawBaseUrl = (import.meta.env.VITE_API_URL ?? '').trim()
const rawGatewayBaseUrl = (import.meta.env.VITE_GATEWAY_API_URL ?? '').trim()

const fallbackBase = '/api'

const normalize = (value: string): string => {
  if (!value) {
    return fallbackBase
  }

  let withoutTrailingSlash = value.replace(/\/+$/, '')

  // Safeguard against compiled/fallback port-less http://localhost (port 80)
  // when the application is actually loaded on a specific port (e.g. 8080 or 5173).
  if (typeof window !== 'undefined') {
    const origin = window.location.origin
    if (
      withoutTrailingSlash === 'http://localhost' ||
      withoutTrailingSlash === 'http://127.0.0.1' ||
      withoutTrailingSlash === 'https://localhost' ||
      withoutTrailingSlash === 'https://127.0.0.1'
    ) {
      withoutTrailingSlash = origin
    }
  }

  if (
    withoutTrailingSlash === '/api' ||
    withoutTrailingSlash.endsWith('/api') ||
    withoutTrailingSlash.includes('/api/')
  ) {
    return withoutTrailingSlash
  }

  return `${withoutTrailingSlash}/api`
}

export const API_URL = normalize(rawBaseUrl)
export const GATEWAY_API_URL = normalize(rawGatewayBaseUrl || rawBaseUrl)
