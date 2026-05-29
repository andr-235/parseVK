import { describe, expect, it, vi } from 'vitest'
import { getRefreshDelayMs } from '../authSession'

const createJwtWithExp = (exp: number): string => {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const payload = Buffer.from(JSON.stringify({ exp })).toString('base64url')
  return `${header}.${payload}.signature`
}

describe('getRefreshDelayMs', () => {
  it('schedules refresh before token expiration with safety leeway', () => {
    const nowMs = 1_763_280_000_000
    vi.spyOn(Date, 'now').mockReturnValue(nowMs)

    const token = createJwtWithExp(Math.floor(nowMs / 1000) + 300)
    const delay = getRefreshDelayMs(token, 60)

    expect(delay).toBe(240_000)
  })
})
