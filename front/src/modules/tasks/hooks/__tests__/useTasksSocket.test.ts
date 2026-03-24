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

describe('useTasksSocket', () => {
  beforeEach(() => {
    mockIo.mockClear()
    mockSocket.on.mockClear()
    mockSocket.disconnect.mockClear()
  })

  it('connects to tasks namespace without forcing websocket-only transport', () => {
    renderHook(() => useTasksSocket())

    expect(mockIo).toHaveBeenCalledTimes(1)
    expect(mockIo.mock.calls[0]?.[0]).toBe('ws://192.168.88.12:8080/api/tasks')
    expect(mockIo.mock.calls[0]).toHaveLength(1)
  })
})
