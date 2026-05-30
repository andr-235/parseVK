import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

beforeEach(() => {
  vi.stubEnv('VITE_GATEWAY_API_URL', undefined)
  vi.stubEnv('VITE_API_URL', undefined)
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('GATEWAY_API_URL', () => {
  it('defaults to /api when no env vars are set', async () => {
    vi.resetModules()
    const { GATEWAY_API_URL } = await import('../config')
    expect(GATEWAY_API_URL).toBe('/api')
  })

  it('uses VITE_GATEWAY_API_URL when set', async () => {
    vi.stubEnv('VITE_GATEWAY_API_URL', 'https://gateway.example.com')
    vi.resetModules()
    const { GATEWAY_API_URL } = await import('../config')
    expect(GATEWAY_API_URL).toBe('https://gateway.example.com')
  })

  it('falls back to VITE_API_URL when VITE_GATEWAY_API_URL is not set', async () => {
    vi.stubEnv('VITE_GATEWAY_API_URL', undefined)
    vi.stubEnv('VITE_API_URL', 'https://legacy.example.com/api')
    vi.resetModules()
    const { GATEWAY_API_URL } = await import('../config')
    expect(GATEWAY_API_URL).toBe('https://legacy.example.com/api')
  })

  it('strips trailing slash', async () => {
    vi.stubEnv('VITE_GATEWAY_API_URL', 'https://gateway.example.com/api/')
    vi.resetModules()
    const { GATEWAY_API_URL } = await import('../config')
    expect(GATEWAY_API_URL).toBe('https://gateway.example.com/api')
  })

  it('handles whitespace-only string by returning /api', async () => {
    vi.stubEnv('VITE_GATEWAY_API_URL', '   ')
    vi.resetModules()
    const { GATEWAY_API_URL } = await import('../config')
    expect(GATEWAY_API_URL).toBe('/api')
  })
})

describe('API_URL', () => {
  it('is deprecated alias of GATEWAY_API_URL', async () => {
    vi.stubEnv('VITE_GATEWAY_API_URL', '/custom')
    vi.resetModules()
    const mod = await import('../config')
    expect(mod.API_URL).toBe(mod.GATEWAY_API_URL)
    expect(mod.API_URL).toBe('/custom')
  })
})
