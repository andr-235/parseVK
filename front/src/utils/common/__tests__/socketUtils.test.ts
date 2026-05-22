import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { resolveSocketBaseUrl, normalizeSocketBase } from '../socketUtils'

describe('socketUtils', () => {
  const originalEnv = import.meta.env.VITE_API_WS_URL
  const originalLocation = window.location

  beforeEach(() => {
    vi.stubGlobal('location', {
      protocol: 'http:',
      host: 'localhost:3000',
      origin: 'http://localhost:3000',
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    import.meta.env.VITE_API_WS_URL = originalEnv
  })

  describe('resolveSocketBaseUrl', () => {
    it('returns VITE_API_WS_URL if it is specified', () => {
      import.meta.env.VITE_API_WS_URL = 'http://test-server.com'
      expect(resolveSocketBaseUrl()).toBe('http://test-server.com')
    })

    it('returns window.location with ws schema when VITE_API_WS_URL is auto', () => {
      import.meta.env.VITE_API_WS_URL = 'auto'
      expect(resolveSocketBaseUrl()).toBe('ws://localhost:3000')
    })

    it('returns window.location with wss schema when VITE_API_WS_URL is auto and location is https', () => {
      import.meta.env.VITE_API_WS_URL = 'auto'
      vi.stubGlobal('location', {
        protocol: 'https:',
        host: 'secured-server.com',
        origin: 'https://secured-server.com',
      })
      expect(resolveSocketBaseUrl()).toBe('wss://secured-server.com')
    })
  })

  describe('normalizeSocketBase', () => {
    it('removes trailing slash', () => {
      expect(normalizeSocketBase('http://localhost:3000/')).toBe('http://localhost:3000')
    })

    it('removes api, tasks, and tgmbase-search suffix', () => {
      expect(normalizeSocketBase('http://localhost:3000/api')).toBe('http://localhost:3000')
      expect(normalizeSocketBase('http://localhost:3000/tasks')).toBe('http://localhost:3000')
      expect(normalizeSocketBase('http://localhost:3000/tgmbase-search')).toBe('http://localhost:3000')
      expect(normalizeSocketBase('http://localhost:3000/api/tasks/')).toBe('http://localhost:3000')
    })

    it('handles relative URLs using location.origin', () => {
      expect(normalizeSocketBase('/api')).toBe('http://localhost:3000')
    })
  })
})
