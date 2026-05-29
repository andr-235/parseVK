import { io, type Socket, type ManagerOptions, type SocketOptions } from 'socket.io-client'

export const resolveSocketBaseUrl = (): string | null => {
  const raw = import.meta.env.VITE_API_WS_URL
  const trimmed = typeof raw === 'string' ? raw.trim() : ''

  if (trimmed === '' || trimmed.toLowerCase() === 'auto') {
    if (typeof window === 'undefined') {
      return null
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${protocol}//${window.location.host}`
  }

  return trimmed
}

export const normalizeSocketBase = (url: string): string => {
  let trimmed = url.trim().replace(/\/$/, '')

  if (!/^wss?:\/\//i.test(trimmed)) {
    try {
      const absolute = new URL(
        trimmed,
        typeof window !== 'undefined' ? window.location.origin : 'http://localhost'
      )
      trimmed = absolute.origin + absolute.pathname.replace(/\/$/, '')
    } catch {
      // Игнорируем ошибки
    }
  }

  let previous: string
  do {
    previous = trimmed
    trimmed = trimmed.replace(/\/(api|tasks|tgmbase-search)$/i, '')
  } while (trimmed !== previous)

  return trimmed
}

export const createNamespaceSocket = (
  namespace: string,
  options?: Partial<ManagerOptions & SocketOptions>
): Socket | null => {
  const baseUrl = resolveSocketBaseUrl()
  if (!baseUrl) {
    return null
  }
  const normalizedBase = normalizeSocketBase(baseUrl)
  const prefix = namespace.startsWith('/') ? '' : '/'
  const namespaceUrl = `${normalizedBase}${prefix}${namespace}`

  if (options) {
    return io(namespaceUrl, options)
  }
  return io(namespaceUrl)
}
