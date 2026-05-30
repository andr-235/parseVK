import toast from 'react-hot-toast'
import { apiClient, ApiError } from '@/shared/api'
import type { CreateParsingTaskDto } from '@/shared/types'
import type { IParsingTaskResult, IParsingTaskSummary } from '@/shared/types'

const TASKS_API_PATH = '/v1/tasks'

export const tasksService = {
  async fetchTasks(): Promise<IParsingTaskSummary[]> {
    try {
      const data = await apiClient.get<{
        tasks: IParsingTaskSummary[]
        total: number
        page: number
        limit: number
      }>(TASKS_API_PATH)
      return data.tasks
    } catch (error) {
      if (error instanceof ApiError && error.isNotFound) {
        return []
      }
      toast.error('Не удалось загрузить задачи')
      throw error
    }
  },

  async fetchTaskDetails(taskId: number | string): Promise<IParsingTaskResult> {
    try {
      return await apiClient.get<IParsingTaskResult>(`${TASKS_API_PATH}/${taskId}`)
    } catch (error) {
      toast.error('Не удалось загрузить детали задачи')
      throw error
    }
  },

  async createParsingTask(dto: CreateParsingTaskDto): Promise<IParsingTaskResult> {
    try {
      const result = await apiClient.post<IParsingTaskResult>(`${TASKS_API_PATH}/parse`, dto)
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
      const result = await apiClient.post<IParsingTaskResult>(`${TASKS_API_PATH}/${id}/resume`)
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
      const result = await apiClient.post<IParsingTaskResult>(`${TASKS_API_PATH}/${id}/check`)
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
      const response = await apiClient.raw(`${TASKS_API_PATH}/${id}`, {
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
  },
}
