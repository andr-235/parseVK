import { useState, useEffect } from 'react'
import type { TelegramExportTask, TaskStatus } from '../types'
import {
  startTelegramExport,
  fetchTelegramJob,
  cancelTelegramJob,
  downloadTelegramXlsx
} from '../../../shared/api/telegram'

export function useTelegramTasks() {
  const [tasks, setTasks] = useState<TelegramExportTask[]>(() => {
    const saved = localStorage.getItem('tg_export_tasks')
    return saved ? JSON.parse(saved) : []
  })
  
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)

  // Сохранение задач в localStorage
  useEffect(() => {
    localStorage.setItem('tg_export_tasks', JSON.stringify(tasks))
  }, [tasks])

  // Периодический опрос (polling) статусов активных задач
  useEffect(() => {
    const activeTasks = tasks.filter(t => t.status === 'pending' || t.status === 'running')
    if (activeTasks.length === 0) return

    const poll = async () => {
      try {
        const updatedTasks = await Promise.all(
          tasks.map(async (task) => {
            // Опрашиваем только реально созданные на бэкенде задачи
            if ((task.status === 'pending' || task.status === 'running') && !task.id.startsWith('temp_')) {
              try {
                const detail = await fetchTelegramJob(task.id)
                const job = detail.job
                
                const formattedLogs = detail.logs.map(log => {
                  const time = new Date(log.createdAt).toLocaleTimeString()
                  const level = log.level.toUpperCase()
                  return `[${time}] [${level}] ${log.message}`
                })
                
                const progress = job.totalCount > 0 ? Math.round((job.fetchedCount / job.totalCount) * 100) : 0
                
                return {
                  ...task,
                  status: job.status as TaskStatus,
                  fetchedCount: job.fetchedCount,
                  totalCount: job.totalCount,
                  progress,
                  logs: formattedLogs,
                  error: job.error || undefined
                }
              } catch (err) {
                console.error(`Error polling task ${task.id}:`, err)
                // Если задача не найдена на сервере, помечаем ошибку в логах
                return {
                  ...task,
                  status: 'failed' as TaskStatus,
                  logs: [
                    ...task.logs,
                    `[${new Date().toLocaleTimeString()}] [ERROR] Ошибка соединения или задача не найдена на сервере.`
                  ]
                }
              }
            }
            return task
          })
        )
        
        // Сравниваем, чтобы избежать бесконечного цикла ререндера
        const hasChanges = JSON.stringify(updatedTasks) !== JSON.stringify(tasks)
        if (hasChanges) {
          setTasks(updatedTasks)
        }
      } catch (e) {
        console.error('Polling error:', e)
      }
    }

    const timer = setInterval(poll, 2000)
    poll() // Вызываем первый раз сразу

    return () => clearInterval(timer)
  }, [tasks])

  const createTask = async (target: string, limit: number, activeOnly: boolean, verifyPhones: boolean) => {
    const tempId = `temp_${Date.now()}`
    
    // Временная задача для быстрого отклика интерфейса
    const tempTask: TelegramExportTask = {
      id: tempId,
      target: target.trim(),
      status: 'pending',
      totalCount: limit === 1000000 ? 500 : limit,
      fetchedCount: 0,
      progress: 0,
      logs: [
        `[${new Date().toLocaleTimeString()}] [INFO] Инициализация задачи на сервере...`,
        `[${new Date().toLocaleTimeString()}] [INFO] Цель: ${target.trim()}`
      ],
      createdAt: new Date().toISOString(),
      settings: {
        limit,
        activeOnly,
        verifyPhones
      }
    }
    
    setTasks(prev => [tempTask, ...prev])
    setSelectedTaskId(tempId)
    
    try {
      const res = await startTelegramExport({
        target: target.trim(),
        limit,
        activeOnly,
        verifyPhones
      })
      
      // Обновляем временную задачу реальным ID с бэкенда
      setTasks(prev =>
        prev.map(t => {
          if (t.id === tempId) {
            return {
              ...t,
              id: res.jobId,
              logs: [
                ...t.logs,
                `[${new Date().toLocaleTimeString()}] [SUCCESS] Задача успешно зарегистрирована на сервере под ID #${res.jobId}`
              ]
            }
          }
          return t
        })
      )
      setSelectedTaskId(res.jobId)
    } catch (err) {
      console.error('Failed to create task:', err)
      setTasks(prev =>
        prev.map(t => {
          if (t.id === tempId) {
            return {
              ...t,
              status: 'failed',
              logs: [
                ...t.logs,
                `[${new Date().toLocaleTimeString()}] [ERROR] Не удалось запустить задачу на сервере: ${err instanceof Error ? err.message : String(err)}`
              ],
              error: err instanceof Error ? err.message : String(err)
            }
          }
          return t
        })
      )
    }
  }

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id))
    if (selectedTaskId === id) {
      setSelectedTaskId(null)
    }
  }

  const cancelTask = async (id: string) => {
    if (id.startsWith('temp_')) {
      setTasks(prev =>
        prev.map(t => (t.id === id ? { ...t, status: 'cancelled' } : t))
      )
      return
    }
    
    try {
      await cancelTelegramJob(id)
      setTasks(prev =>
        prev.map(t => {
          if (t.id === id) {
            return {
              ...t,
              status: 'cancelled',
              logs: [...t.logs, `[${new Date().toLocaleTimeString()}] [WARNING] Отправлен запрос на отмену задачи.`]
            }
          }
          return t
        })
      )
    } catch (err) {
      console.error('Failed to cancel task:', err)
      alert('Не удалось отменить задачу: ' + (err instanceof Error ? err.message : String(err)))
    }
  }

  const retryTask = async (id: string) => {
    const task = tasks.find(t => t.id === id)
    if (!task) return
    
    try {
      const res = await startTelegramExport({
        target: task.target,
        limit: task.settings.limit,
        activeOnly: task.settings.activeOnly,
        verifyPhones: task.settings.verifyPhones
      })
      
      setTasks(prev =>
        prev.map(t => {
          if (t.id === id) {
            return {
              ...t,
              id: res.jobId,
              status: 'pending',
              fetchedCount: 0,
              progress: 0,
              logs: [
                `[${new Date().toLocaleTimeString()}] [INFO] Перезапуск задачи на сервере, новый ID: #${res.jobId}`,
                `[${new Date().toLocaleTimeString()}] [INFO] Цель: ${t.target}`
              ]
            }
          }
          return t
        })
      )
      setSelectedTaskId(res.jobId)
    } catch (err) {
      console.error('Failed to retry task:', err)
      alert('Не удалось перезапустить задачу на сервере: ' + (err instanceof Error ? err.message : String(err)))
    }
  }

  const downloadResults = async (task: TelegramExportTask) => {
    try {
      const blob = await downloadTelegramXlsx(task.id)
      const cleanName = task.target.replace(/^(https:\/\/t\.me\/|@)/, '').replace(/[^a-zA-Z0-9_]/g, '_')
      const filename = `telegram_export_${cleanName || 'members'}_${task.id}.xlsx`
      
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Failed to download results:', err)
      alert('Не удалось скачать файл результатов: ' + (err instanceof Error ? err.message : String(err)))
    }
  }

  return {
    tasks,
    selectedTaskId,
    setSelectedTaskId,
    createTask,
    deleteTask,
    cancelTask,
    retryTask,
    downloadResults
  }
}
