import toast from 'react-hot-toast'
import { tasksApi } from '../api/tasksApi'
import type { CreateParsingTaskDto } from '../dto'
import type { IParsingTaskResult, IParsingTaskSummary } from '../types/api'

export const tasksService = {
  async fetchTasks(): Promise<IParsingTaskSummary[]> {
    try {
      return await tasksApi.getTasks()
    } catch (error) {
      toast.error('Не удалось загрузить задачи')
      throw error
    }
  },

  async fetchTaskDetails(taskId: number | string): Promise<IParsingTaskResult> {
    try {
      return await tasksApi.getTaskDetails(taskId)
    } catch (error) {
      toast.error('Не удалось загрузить детали задачи')
      throw error
    }
  },

  async createParsingTask(dto: CreateParsingTaskDto): Promise<IParsingTaskResult> {
    try {
      const result = await tasksApi.createParsingTask(dto)
      toast.success('Задача на парсинг создана')
      return result
    } catch (error) {
      toast.error('Не удалось создать задачу на парсинг')
      throw error
    }
  }
}
