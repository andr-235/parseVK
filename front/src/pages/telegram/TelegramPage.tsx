import { useTelegramTasks } from './hooks/useTelegramTasks'
import { TelegramDeanonForm } from './components/TelegramDeanonForm'
import { TelegramTaskTable } from './components/TelegramTaskTable'
import { TelegramLogViewer } from './components/TelegramLogViewer'
import { PageShell } from '../../components/layout/PageShell'
import { Send } from 'lucide-react'

export function TelegramPage() {
  const {
    tasks,
    selectedTaskId,
    setSelectedTaskId,
    createTask,
    deleteTask,
    cancelTask,
    retryTask,
    downloadResults
  } = useTelegramTasks()

  // Filter tasks to show only export / deanon tasks on this page
  const exportTasks = tasks.filter(t => t.taskType !== 'live_parse')
  const activeTask = exportTasks.find(t => t.id === selectedTaskId)

  return (
    <PageShell title="Выгрузка участников Telegram">
      <div className="space-y-6">
        {/* Описание страницы */}
        <div className="rounded-lg border border-border bg-bg-panel p-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 text-accent">
              <Send size={18} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-text-primary">Выгрузка участников Telegram-групп</h2>
              <p className="mt-1 text-xs text-text-secondary leading-relaxed">
                Введите ссылку на публичную/приватную группу или ее ID, чтобы запустить задачу выгрузки участников.
                Для экспорта участников не требуется быть администратором группы.
                Результаты можно скачать в формате XLSX.
              </p>
            </div>
          </div>
        </div>

        {/* Форма создания задачи */}
        <TelegramDeanonForm onSubmit={createTask} />

        {/* Панель со списком задач и просмотром логов */}
        <div className="flex flex-col lg:flex-row gap-6 items-stretch min-h-[400px]">
          <TelegramTaskTable
            tasks={exportTasks}
            selectedTaskId={selectedTaskId}
            onSelectTask={setSelectedTaskId}
            onDownload={downloadResults}
            onCancel={cancelTask}
            onRetry={retryTask}
            onDelete={deleteTask}
          />

          {activeTask && (
            <TelegramLogViewer
              task={activeTask}
              onClose={() => setSelectedTaskId(null)}
            />
          )}
        </div>
      </div>
    </PageShell>
  )
}
