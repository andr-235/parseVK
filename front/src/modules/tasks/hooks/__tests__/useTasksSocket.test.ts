import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useTasksSocket } from '../useTasksSocket'

const mockSocket = {
  on: vi.fn(),
  disconnect: vi.fn(),
}

const mockIo = vi.fn(() => mockSocket)

vi.mock('socket.io-client', () => ({
  io: (...args: unknown[]) => mockIo(...args),
}))

const resolveExpectedTasksSocketUrl = () => {
  const raw = import.meta.env.VITE_API_WS_URL
  const trimmed = typeof raw === 'string' ? raw.trim() : ''

  if (trimmed !== '' && trimmed.toLowerCase() !== 'auto') {
    return trimmed
  }

  return `ws://${window.location.host}/tasks`
}

describe('useTasksSocket', () => {
  beforeEach(() => {
    mockIo.mockClear()
    mockSocket.on.mockClear()
    mockSocket.disconnect.mockClear()
  })

  it('connects to tasks namespace without forcing websocket-only transport', () => {
    renderHook(() => useTasksSocket())

    expect(mockIo).toHaveBeenCalledTimes(1)
    expect(mockIo.mock.calls[0]?.[0]).toBe(resolveExpectedTasksSocketUrl())
    expect(mockIo.mock.calls[0]).toHaveLength(1)
  })
})
