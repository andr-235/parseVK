import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createApiClient } from '../client/httpClient'
import { ApiError, NetworkError } from '../client/errors'

const BASE = '/api'

function mockResponse(body: unknown, status = 200, headers?: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  })
}

describe('createApiClient', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
  })

  describe('request methods', () => {
    it('get() makes GET request and returns parsed JSON', async () => {
      fetchMock.mockResolvedValue(mockResponse({ data: 'ok' }))
      const client = createApiClient(BASE)

      const result = await client.get<{ data: string }>('/test')

      expect(result).toEqual({ data: 'ok' })
      expect(fetchMock).toHaveBeenCalledWith('/api/test', expect.objectContaining({ method: 'GET' }))
    })

    it('get() with params builds query string', async () => {
      fetchMock.mockResolvedValue(mockResponse({ items: [] }))
      const client = createApiClient(BASE)

      await client.get('/items', { offset: 10, limit: 5 })

      expect(fetchMock).toHaveBeenCalledWith(
        '/api/items?offset=10&limit=5',
        expect.objectContaining({ method: 'GET' })
      )
    })

    it('get() filters out null and undefined params', async () => {
      fetchMock.mockResolvedValue(mockResponse({}))
      const client = createApiClient(BASE)

      await client.get('/items', { a: 1, b: undefined, c: null, d: 0 })

      expect(fetchMock).toHaveBeenCalledWith(
        '/api/items?a=1&d=0',
        expect.any(Object)
      )
    })

    it('post() sends JSON body', async () => {
      fetchMock.mockResolvedValue(mockResponse({ id: 1 }))
      const client = createApiClient(BASE)

      await client.post('/resource', { name: 'test' })

      expect(fetchMock).toHaveBeenCalledWith(
        '/api/resource',
        expect.objectContaining({ method: 'POST', body: JSON.stringify({ name: 'test' }) })
      )
    })

    it('post() sets Content-Type for JSON body', async () => {
      fetchMock.mockResolvedValue(mockResponse({ id: 1 }))
      const client = createApiClient(BASE)

      await client.post('/resource', { name: 'test' })

      const callHeaders = new Headers((fetchMock.mock.calls[0]?.[1] as RequestInit)?.headers)
      expect(callHeaders.get('Content-Type')).toBe('application/json')
    })

    it('raw() does not set Content-Type for FormData body', async () => {
      fetchMock.mockResolvedValue(new Response(null, { status: 204 }))
      const client = createApiClient(BASE)
      const formData = new FormData()
      formData.append('file', 'test')

      await client.raw('/upload', { method: 'POST', body: formData })

      const callHeaders = new Headers((fetchMock.mock.calls[0]?.[1] as RequestInit)?.headers)
      expect(callHeaders.has('Content-Type')).toBe(false)
    })

    it('post() with no body sends undefined body', async () => {
      fetchMock.mockResolvedValue(mockResponse({}))
      const client = createApiClient(BASE)

      await client.post('/resource')

      expect(fetchMock).toHaveBeenCalledWith(
        '/api/resource',
        expect.objectContaining({ method: 'POST', body: undefined })
      )
    })

    it('put() sends JSON body with PUT method', async () => {
      fetchMock.mockResolvedValue(mockResponse({ updated: true }))
      const client = createApiClient(BASE)

      await client.put('/resource/1', { value: 'new' })

      expect(fetchMock).toHaveBeenCalledWith(
        '/api/resource/1',
        expect.objectContaining({ method: 'PUT', body: JSON.stringify({ value: 'new' }) })
      )
    })

    it('patch() sends JSON body with PATCH method', async () => {
      fetchMock.mockResolvedValue(mockResponse({ patched: true }))
      const client = createApiClient(BASE)

      await client.patch('/resource/1', { field: 'updated' })

      expect(fetchMock).toHaveBeenCalledWith(
        '/api/resource/1',
        expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ field: 'updated' }) })
      )
    })

    it('delete() makes DELETE request', async () => {
      fetchMock.mockResolvedValue(mockResponse({ deleted: true }))
      const client = createApiClient(BASE)

      await client.delete('/resource/1')

      expect(fetchMock).toHaveBeenCalledWith(
        '/api/resource/1',
        expect.objectContaining({ method: 'DELETE' })
      )
    })
  })

  describe('raw()', () => {
    it('returns raw Response without parsing JSON', async () => {
      fetchMock.mockResolvedValue(new Response('raw body', { status: 200 }))
      const client = createApiClient(BASE)

      const response = await client.raw('/stream')

      expect(response).toBeInstanceOf(Response)
      const text = await response.text()
      expect(text).toBe('raw body')
    })

    it('does not inject Authorization header', async () => {
      fetchMock.mockResolvedValue(new Response(null, { status: 204 }))
      const auth = { getAccessToken: () => 'secret', refreshAccessToken: () => Promise.resolve(null) }
      const client = createApiClient(BASE, auth)

      await client.raw('/no-auth')

      const headers = new Headers((fetchMock.mock.calls[0]?.[1] as RequestInit)?.headers)
      expect(headers.has('Authorization')).toBe(false)
    })
  })

  describe('auth integration', () => {
    it('injects Authorization header when token is available', async () => {
      fetchMock.mockResolvedValue(mockResponse({}))
      const auth = { getAccessToken: () => 'my-token', refreshAccessToken: () => Promise.resolve(null) }
      const client = createApiClient(BASE, auth)

      await client.get('/secure')

      const headers = new Headers((fetchMock.mock.calls[0]?.[1] as RequestInit)?.headers)
      expect(headers.get('Authorization')).toBe('Bearer my-token')
    })

    it('does not inject Authorization header if no token', async () => {
      fetchMock.mockResolvedValue(mockResponse({}))
      const auth = { getAccessToken: () => null, refreshAccessToken: () => Promise.resolve(null) }
      const client = createApiClient(BASE, auth)

      await client.get('/public')

      const headers = new Headers((fetchMock.mock.calls[0]?.[1] as RequestInit)?.headers)
      expect(headers.has('Authorization')).toBe(false)
    })

    it('does not inject Authorization if no auth provider', async () => {
      fetchMock.mockResolvedValue(mockResponse({}))
      const client = createApiClient(BASE)

      await client.get('/public')

      const headers = new Headers((fetchMock.mock.calls[0]?.[1] as RequestInit)?.headers)
      expect(headers.has('Authorization')).toBe(false)
    })

    it('retries once on 401 when auth provider returns new token', async () => {
      fetchMock
        .mockResolvedValueOnce(new Response(null, { status: 401 }))
        .mockResolvedValueOnce(mockResponse({ success: true }))
      const auth = { getAccessToken: () => 'old-token', refreshAccessToken: () => Promise.resolve('new-token') }
      const client = createApiClient(BASE, auth)

      const result = await client.get<{ success: boolean }>('/retry')

      expect(result).toEqual({ success: true })
      expect(fetchMock).toHaveBeenCalledTimes(2)

      const firstHeaders = new Headers((fetchMock.mock.calls[0]?.[1] as RequestInit)?.headers)
      expect(firstHeaders.get('Authorization')).toBe('Bearer old-token')

      const retryHeaders = new Headers((fetchMock.mock.calls[1]?.[1] as RequestInit)?.headers)
      expect(retryHeaders.get('Authorization')).toBe('Bearer new-token')
    })

    it('throws ApiError on 401 when refresh returns null', async () => {
      fetchMock.mockResolvedValue(new Response(JSON.stringify({ message: 'unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } }))
      const auth = { getAccessToken: () => 'old-token', refreshAccessToken: () => Promise.resolve(null) }
      const client = createApiClient(BASE, auth)

      await expect(client.get('/fail')).rejects.toThrow(ApiError)
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    it('throws ApiError on 401 when no auth provider', async () => {
      fetchMock.mockResolvedValue(new Response(null, { status: 401 }))
      const client = createApiClient(BASE)

      await expect(client.get('/no-auth')).rejects.toThrow(ApiError)
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })
  })

  describe('error handling', () => {
    it('throws ApiError with status and body for non-ok response', async () => {
      fetchMock.mockResolvedValue(
        new Response(JSON.stringify({ message: 'Not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } })
      )
      const client = createApiClient(BASE)

      try {
        await client.get('/missing')
        expect.unreachable()
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError)
        const apiError = error as ApiError
        expect(apiError.status).toBe(404)
        expect(apiError.isNotFound).toBe(true)
        expect(apiError.message).toBe('Not found')
      }
    })

    it('throws NetworkError when fetch fails', async () => {
      fetchMock.mockRejectedValue(new TypeError('Network failure'))
      const client = createApiClient(BASE)

      try {
        await client.get('/fail')
        expect.unreachable()
      } catch (error) {
        expect(error).toBeInstanceOf(NetworkError)
        expect((error as NetworkError).cause).toBeInstanceOf(TypeError)
      }
    })

    it('throws NetworkError when retry fetch fails', async () => {
      fetchMock
        .mockResolvedValueOnce(new Response(null, { status: 401 }))
        .mockRejectedValueOnce(new TypeError('Retry failed'))
      const auth = { getAccessToken: () => 'token', refreshAccessToken: () => Promise.resolve('new') }
      const client = createApiClient(BASE, auth)

      await expect(client.get('/bad-retry')).rejects.toThrow(NetworkError)
    })

    it('parses error message from Array response', async () => {
      fetchMock.mockResolvedValue(
        new Response(JSON.stringify({ message: ['First error', 'Second error'] }), { status: 422, headers: { 'Content-Type': 'application/json' } })
      )
      const client = createApiClient(BASE)

      try {
        await client.get('/validation')
        expect.unreachable()
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError)
        expect((error as ApiError).message).toBe('First error')
        expect((error as ApiError).isValidationError).toBe(true)
      }
    })

    it('uses default message when error body has no message', async () => {
      fetchMock.mockResolvedValue(new Response(null, { status: 500 }))
      const client = createApiClient(BASE)

      try {
        await client.get('/server-error')
        expect.unreachable()
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError)
        expect((error as ApiError).message).toBe('Request failed')
        expect((error as ApiError).status).toBe(500)
      }
    })

    it('sets status helpers correctly', async () => {
      fetchMock.mockResolvedValue(new Response(null, { status: 403 }))
      const client = createApiClient(BASE)

      try {
        await client.get('/forbidden')
        expect.unreachable()
      } catch (error) {
        const apiError = error as ApiError
        expect(apiError.isUnauthorized).toBe(false)
        expect(apiError.isForbidden).toBe(true)
        expect(apiError.isNotFound).toBe(false)
        expect(apiError.isValidationError).toBe(false)
      }
    })
  })
})
