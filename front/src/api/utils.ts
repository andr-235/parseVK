type QueryParams = Record<string, string | number | boolean | undefined | null>

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

export function createRequest(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  }

  const headers = {
    ...defaultHeaders,
    ...options.headers,
  }

  return fetch(url, {
    ...options,
    headers,
  })
}

