import type { CreateParsingTaskDto } from '../dto'
import type { IParsingTaskResult, IParsingTaskSummary } from '../types/api'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export const tasksApi = {
  async createParsingTask(dto: CreateParsingTaskDto): Promise<IParsingTaskResult> {
    const response = await fetch(`${API_URL}/tasks/parse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto)
    })

    if (!response.ok) {
      throw new Error('Failed to create parsing task')
    }

    return response.json()
  },

  async getTasks(): Promise<IParsingTaskSummary[]> {
    const response = await fetch(`${API_URL}/tasks`)

    if (response.status === 404) {
      return []
    }

    if (!response.ok) {
      throw new Error('Failed to fetch tasks')
    }

    return response.json()
  },

  async getTaskDetails(taskId: number | string): Promise<IParsingTaskResult> {
    const response = await fetch(`${API_URL}/tasks/${taskId}`)

    if (!response.ok) {
      throw new Error('Failed to fetch task details')
    }

    return response.json()
  },

  async resumeTask(taskId: number | string): Promise<IParsingTaskResult> {
    const id = encodeURIComponent(String(taskId))
    const response = await fetch(`${API_URL}/tasks/${id}/resume`, {
      method: 'POST'
    })

    if (!response.ok) {
      throw new Error('Failed to resume task')
    }

    return response.json()
  }
}
