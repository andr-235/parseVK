import { useTelegramTasks } from '../telegram/hooks/useTelegramTasks'
import { TelegramDeanonForm } from './components/TelegramDeanonForm'
import { TelegramTaskTable } from '../telegram/components/TelegramTaskTable'
import { TelegramLogViewer } from '../telegram/components/TelegramLogViewer'
import { PageShell } from '../../components/layout/PageShell'
import { Upload } from 'lucide-react'

export function TelegramDlUploadPage() {
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
    <PageShell title="Выгрузка с ДЛ (Деанонимизация)">
      <div className="space-y-6">
        {/* Описание страницы */}
        <div className="rounded-lg border border-border bg-bg-panel p-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 text-accent">
              <Upload size={18} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-text-primary">Пакетная деанонимизация участников Telegram групп</h2>
              <p className="mt-1 text-xs text-text-secondary leading-relaxed">
                Введите ID, username или ссылку на публичную/приватную группу Telegram, чтобы начать экспорт метаданных.
                Для выгрузки участников не требуется обладать правами администратора в целевом чате.
                Выгруженные таблицы участников можно скачать в формате XLSX.
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
