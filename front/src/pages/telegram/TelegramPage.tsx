import { useTelegramTasks } from './hooks/useTelegramTasks'
import { TelegramExportForm } from './components/TelegramExportForm'
import { TelegramTaskTable } from './components/TelegramTaskTable'
import { TelegramLogViewer } from './components/TelegramLogViewer'
import { PageShell } from '../../components/layout/PageShell'
import { Database } from 'lucide-react'

export function TelegramPage() {
  const {
    tasks,
    dialogs,
    selectedTaskId,
    setSelectedTaskId,
    createTask,
    startLiveParse,
    deleteTask,
    cancelTask,
    retryTask,
    downloadResults
  } = useTelegramTasks()

  const activeTask = tasks.find(t => t.id === selectedTaskId)

  return (
    <PageShell title="Выгрузка участников Telegram-групп">
      <div className="space-y-6">
        {/* Описание */}
        <div className="rounded-lg border border-border bg-bg-panel p-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 text-accent">
              <Database size={18} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-text-primary">Фоновый экспорт метаданных и участников чатов</h2>
              <p className="mt-1 text-xs text-text-secondary leading-relaxed">
                Введите ссылку на публичный/приватный канал или супергруппу Telegram, чтобы запустить задачу выгрузки. 
                Или переключитесь в режим прямого эфира, чтобы в реальном времени парсить поступающие сообщения и комментарии 
                из каналов и чатов пользователя.
              </p>
            </div>
          </div>
        </div>

        {/* Форма создания задачи */}
        <TelegramExportForm 
          onSubmit={createTask} 
          onLiveParseSubmit={startLiveParse}
          dialogs={dialogs}
        />


        {/* Панель со списком задач и просмотром логов */}
        <div className="flex flex-col lg:flex-row gap-6 items-stretch min-h-[400px]">
          <TelegramTaskTable
            tasks={tasks}
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
