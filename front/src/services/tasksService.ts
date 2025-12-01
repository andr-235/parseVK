import toast from 'react-hot-toast'
import { API_URL } from '@/lib/apiConfig'
import { createRequest, handleResponse } from '@/lib/apiUtils'
import type { CreateParsingTaskDto } from '@/types/dto'
import type { IParsingTaskResult, IParsingTaskSummary } from '@/types/api'

export const tasksService = {
  async fetchTasks(): Promise<IParsingTaskSummary[]> {
    try {
      const response = await fetch(`${API_URL}/tasks`)

      if (response.status === 404) {
        return []
      }

      const data = await handleResponse<IParsingTaskSummary[]>(response, 'Failed to fetch tasks')
      return data
    } catch (error) {
      toast.error('Не удалось загрузить задачи')
      throw error
    }
  },

  async fetchTaskDetails(taskId: number | string): Promise<IParsingTaskResult> {
    try {
      const response = await fetch(`${API_URL}/tasks/${taskId}`)
      return await handleResponse<IParsingTaskResult>(response, 'Failed to fetch task details')
    } catch (error) {
      toast.error('Не удалось загрузить детали задачи')
      throw error
    }
  },

  async createParsingTask(dto: CreateParsingTaskDto): Promise<IParsingTaskResult> {
    try {
      const response = await createRequest(`${API_URL}/tasks/parse`, {
        method: 'POST',
        body: JSON.stringify(dto),
      })

      const result = await handleResponse<IParsingTaskResult>(response, 'Failed to create parsing task')
      toast.success('Задача на парсинг создана')
      return result
    } catch (error) {
      toast.error('Не удалось создать задачу на парсинг')
      throw error
    }
  },

  async resumeTask(taskId: number | string): Promise<IParsingTaskResult> {
    try {
      const id = encodeURIComponent(String(taskId))
      const response = await fetch(`${API_URL}/tasks/${id}/resume`, {
        method: 'POST',
      })

      const result = await handleResponse<IParsingTaskResult>(response, 'Failed to resume task')
      toast.success('Задача возобновлена')
      return result
    } catch (error) {
      toast.error('Не удалось возобновить задачу')
      throw error
    }
  },

  async checkTask(taskId: number | string): Promise<IParsingTaskResult> {
    try {
      const id = encodeURIComponent(String(taskId))
      const response = await fetch(`${API_URL}/tasks/${id}/check`, {
        method: 'POST',
      })

      const result = await handleResponse<IParsingTaskResult>(response, 'Failed to check task')
      if (result.status === 'done' || result.completed) {
        toast.success('Задача отмечена как завершённая')
      } else {
        toast.success('Задача возвращена в очередь')
      }
      return result
    } catch (error) {
      toast.error('Не удалось проверить задачу')
      throw error
    }
  },

  async deleteTask(taskId: number | string): Promise<void> {
    try {
      const id = encodeURIComponent(String(taskId))
      const response = await fetch(`${API_URL}/tasks/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete task')
      }
      toast.success('Задача удалена')
    } catch (error) {
      toast.error('Не удалось удалить задачу')
      throw error
    }
  }
}
