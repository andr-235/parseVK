import { useEffect } from 'react'
import { type Socket } from 'socket.io-client'
import { useTasksStore } from '@/pages/tasks/store'
import { createNamespaceSocket } from '@/shared/utils'
import {
  applyTaskSocketPayload,
  type GatewayTaskStatus,
  type TaskSocketPayload,
} from './tasksSocketUpdate'

export type { GatewayTaskStatus, TaskSocketPayload }

export interface UseTasksSocketOptions {
  enabled?: boolean
  onConnect?: () => void
  onDisconnect?: () => void
  onConnectError?: () => void
}

type TaskServerEvents = {
  'task-progress': (payload: TaskSocketPayload) => void
  'task-status': (payload: TaskSocketPayload) => void
}

type TaskClientEvents = Record<string, never>

const applyTaskUpdate = (payload: TaskSocketPayload, source: string): void => {
  useTasksStore.setState(
    (state) => {
      applyTaskSocketPayload(state, payload)
    },
    false,
    `tasks-socket/${source}`
  )
}

export const useTasksSocket = (options?: UseTasksSocketOptions): void => {
  const { enabled = true, onConnect, onDisconnect, onConnectError } = options ?? {}

  useEffect(() => {
    if (!enabled) {
      useTasksStore.setState((state) => {
        state.isSocketConnected = false
      })
      return
    }

    const socket = createNamespaceSocket('tasks') as Socket<
      TaskServerEvents,
      TaskClientEvents
    > | null

    if (!socket) {
      if (import.meta.env.DEV) {
        console.warn(
          '[useTasksSocket] VITE_API_WS_URL is not defined, skipping websocket connection'
        )
      }
      onConnectError?.()
      return
    }

    socket.on('connect', () => {
      useTasksStore.setState((state) => {
        state.isSocketConnected = true
      })
      onConnect?.()
    })

    socket.on('disconnect', () => {
      useTasksStore.setState((state) => {
        state.isSocketConnected = false
      })
      onDisconnect?.()
    })

    socket.on('connect_error', () => {
      useTasksStore.setState((state) => {
        state.isSocketConnected = false
      })
      onConnectError?.()
    })

    socket.on('task-progress', (payload) => {
      applyTaskUpdate(payload, 'progress')
    })

    socket.on('task-status', (payload) => {
      applyTaskUpdate(payload, 'status')
    })

    return () => {
      useTasksStore.setState((state) => {
        state.isSocketConnected = false
      })
      socket.disconnect()
    }
  }, [enabled, onConnect, onConnectError, onDisconnect])
}
