const normalize = (value: string): string => {
  if (!value) return '/api'
  return value.replace(/\/+$/, '')
}

export const GATEWAY_API_URL = normalize(
  (import.meta.env.VITE_GATEWAY_API_URL ?? import.meta.env.VITE_API_URL ?? '').trim()
)

/** @deprecated Use GATEWAY_API_URL instead */
export const API_URL = GATEWAY_API_URL
