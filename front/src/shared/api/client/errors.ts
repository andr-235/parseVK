export class ApiError extends Error {
  readonly status: number
  readonly body: unknown

  constructor(message: string, status: number, body?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }

  get isUnauthorized(): boolean { return this.status === 401 }
  get isForbidden(): boolean { return this.status === 403 }
  get isNotFound(): boolean { return this.status === 404 }
  get isValidationError(): boolean { return this.status === 422 }
}

export class NetworkError extends Error {
  readonly cause: unknown

  constructor(cause: unknown) {
    super('Network error')
    this.name = 'NetworkError'
    this.cause = cause
  }
}
