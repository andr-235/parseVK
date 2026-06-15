import { useTelegramTasks } from '../telegram/hooks/useTelegramTasks'
import { TelegramLiveForm } from './components/TelegramLiveForm'
import { TelegramTaskTable } from '../telegram/components/TelegramTaskTable'
import { TelegramLogViewer } from '../telegram/components/TelegramLogViewer'
import { PageShell } from '../../components/layout/PageShell'
import { Search } from 'lucide-react'

export function TgmbaseSearchPage() {
  const {
    tasks,
    dialogs,
    selectedTaskId,
    setSelectedTaskId,
    startLiveParse,
    deleteTask,
    cancelTask,
    retryTask,
    downloadResults
  } = useTelegramTasks()

  // Filter tasks to show only live parse tasks on this page
  const liveTasks = tasks.filter(t => t.taskType === 'live_parse')
  const activeTask = liveTasks.find(t => t.id === selectedTaskId)

  return (
    <PageShell title="Поиск по каналам (Прямой эфир)">
      <div className="space-y-6">
        {/* Описание страницы */}
        <div className="rounded-lg border border-border bg-bg-panel p-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 text-accent">
              <Search size={18} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-text-primary">Парсинг сообщений и комментариев Telegram в реальном времени</h2>
              <p className="mt-1 text-xs text-text-secondary leading-relaxed">
                Выберите конкретную группу/канал вашего аккаунта или запустите глобальное прослушивание.
                Сервис начнет стриминг всех новых сообщений и комментариев. Вы сможете отслеживать
                поток событий в реальном времени через лог-интерфейс ниже.
              </p>
            </div>
          </div>
        </div>

        {/* Форма запуска прямого эфира */}
        <TelegramLiveForm onSubmit={startLiveParse} dialogs={dialogs} />

        {/* Панель со списком задач и просмотром логов */}
        <div className="flex flex-col lg:flex-row gap-6 items-stretch min-h-[400px]">
          <TelegramTaskTable
            tasks={liveTasks}
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
