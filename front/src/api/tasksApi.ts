import { API_URL } from './config'
import { createRequest, handleResponse } from './utils'
import type { CreateParsingTaskDto } from '../dto'
import type { IParsingTaskResult, IParsingTaskSummary } from '../types/api'

export const tasksApi = {
  async createParsingTask(dto: CreateParsingTaskDto): Promise<IParsingTaskResult> {
    const response = await createRequest(`${API_URL}/tasks/parse`, {
      method: 'POST',
      body: JSON.stringify(dto),
    })

    return handleResponse<IParsingTaskResult>(response, 'Failed to create parsing task')
  },

  async getTasks(): Promise<IParsingTaskSummary[]> {
    const response = await fetch(`${API_URL}/tasks`)

    if (response.status === 404) {
      return []
    }

    return handleResponse<IParsingTaskSummary[]>(response, 'Failed to fetch tasks')
  },

  async getTaskDetails(taskId: number | string): Promise<IParsingTaskResult> {
    const response = await fetch(`${API_URL}/tasks/${taskId}`)

    return handleResponse<IParsingTaskResult>(response, 'Failed to fetch task details')
  },

  async resumeTask(taskId: number | string): Promise<IParsingTaskResult> {
    const id = encodeURIComponent(String(taskId))
    const response = await fetch(`${API_URL}/tasks/${id}/resume`, {
      method: 'POST',
    })

    return handleResponse<IParsingTaskResult>(response, 'Failed to resume task')
  },

  async checkTask(taskId: number | string): Promise<IParsingTaskResult> {
    const id = encodeURIComponent(String(taskId))
    const response = await fetch(`${API_URL}/tasks/${id}/check`, {
      method: 'POST',
    })

    return handleResponse<IParsingTaskResult>(response, 'Failed to check task')
  },

  async deleteTask(taskId: number | string): Promise<void> {
    const id = encodeURIComponent(String(taskId))
    const response = await fetch(`${API_URL}/tasks/${id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      throw new Error('Failed to delete task')
    }
  },
}
