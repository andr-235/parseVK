export const DEFAULT_RECONNECT_CONFIG = {
  maxRetries: 10,
  baseDelayMs: 1000,
  maxDelayMs: 30_000,
  jitterFactor: 0.1,
}

export function getReconnectDelay(attempt: number, config = DEFAULT_RECONNECT_CONFIG): number {
  const exponentialDelay = Math.min(
    config.baseDelayMs * Math.pow(2, attempt),
    config.maxDelayMs,
  )
  const jitter = exponentialDelay * config.jitterFactor * Math.random()
  return exponentialDelay + jitter
}
