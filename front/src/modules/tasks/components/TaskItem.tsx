import { memo } from 'react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import {
  RotateCw,
  Trash2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  FileText,
  MessageSquare,
  Calendar,
  MoreVertical,
  ArrowRight,
} from 'lucide-react'

import { Card } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import ProgressBar from '@/shared/components/ProgressBar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import { Separator } from '@/shared/ui/separator'

import { cn } from '@/lib/utils'
import type { Task } from '@/types'
import { calculateTaskProgress, isTaskActive } from '@/modules/tasks/utils/taskProgress'
import { getTaskStatusText } from '@/modules/tasks/utils/statusHelpers'
import { useTaskActions } from '@/modules/tasks/hooks/useTaskActions'

interface TaskItemProps {
  task: Task
  onSelect: (taskId: number | string) => void
}

const TaskItem = memo(({ task, onSelect }: TaskItemProps) => {
  const { resumeTask, deleteTask, checkTask } = useTaskActions()

  const progress = calculateTaskProgress(task)
  const isActive = isTaskActive(task)

  // Calculate stats
  const groupsCount = task.groupsCount || 0
  const postsCount = task.stats?.posts || 0
  const commentsCount = task.stats?.comments || 0

  const percent = progress.total > 0 ? Math.round((progress.processed / progress.total) * 100) : 0
  const progressTone =
    task.status === 'failed' ? 'danger' : task.status === 'completed' ? 'success' : 'primary'

  const handleResume = (e: React.MouseEvent) => {
    e.stopPropagation()
    resumeTask(task.id)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    deleteTask(task.id)
  }

  const handleCheck = (e: React.MouseEvent) => {
    e.stopPropagation()
    checkTask(task.id)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
      case 'failed':
        return 'text-rose-500 bg-rose-500/10 border-rose-500/20'
      case 'running':
        return 'text-sky-500 bg-sky-500/10 border-sky-500/20'
      case 'processing':
        return 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20'
      default:
        return 'text-amber-500 bg-amber-500/10 border-amber-500/20'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4" />
      case 'failed':
        return <AlertCircle className="w-4 h-4" />
      case 'running':
        return <RotateCw className="w-4 h-4 animate-spin" />
      case 'processing':
        return <RotateCw className="w-4 h-4 animate-spin" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  return (
    <Card
      onClick={() => onSelect(task.id)}
      className="group relative overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-soft-md hover:border-border/80"
    >
      <div className="flex flex-col gap-4 p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg leading-none truncate text-foreground">
                {task.title || `Задача #${task.id}`}
              </h3>
              <Badge
                variant="outline"
                className={cn(
                  'gap-1.5 h-6 rounded-full text-[11px] font-semibold tracking-wide',
                  getStatusColor(task.status)
                )}
              >
                {getStatusIcon(task.status)}
                {getTaskStatusText(task.status)}
              </Badge>
            </div>

            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>
                  {task.createdAt
                    ? format(new Date(task.createdAt), 'd MMM HH:mm', { locale: ru })
                    : '—'}
                </span>
              </div>
              {task.completedAt && (
                <>
                  <ArrowRight className="w-3.5 h-3.5 opacity-50" />
                  <span>{format(new Date(task.completedAt), 'HH:mm', { locale: ru })}</span>
                </>
              )}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 -mr-2 text-muted-foreground hover:text-foreground"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {(task.status === 'failed' || task.status === 'completed') && (
                <DropdownMenuItem onClick={handleResume}>
                  <RotateCw className="w-4 h-4 mr-2" />
                  Перезапустить
                </DropdownMenuItem>
              )}
              {isActive && (
                <DropdownMenuItem onClick={handleCheck}>
                  <RotateCw className="w-4 h-4 mr-2" />
                  Проверить статус
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                className="text-rose-500 focus:text-rose-500"
                onClick={handleDelete}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Удалить
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Progress */}
        {isActive ? (
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium text-muted-foreground">
              <span>Прогресс</span>
              <span>{percent}%</span>
            </div>
            <ProgressBar
              current={progress.processed}
              total={progress.total}
              tone={progressTone}
              size="small"
              showLabel={false}
              className="gap-1.5"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                Обработано: {progress.processed} из {progress.total}
              </span>
              {progress.failed > 0 && (
                <span className="text-rose-500">Ошибок: {progress.failed}</span>
              )}
            </div>
          </div>
        ) : (
          <Separator className="bg-border/50" />
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 pt-1">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              Группы
            </span>
            <span className="text-sm font-medium">{groupsCount}</span>
          </div>

          <div className="flex flex-col gap-1 border-l border-border/30 pl-4">
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              Посты
            </span>
            <span className="text-sm font-medium">{postsCount}</span>
          </div>

          <div className="flex flex-col gap-1 border-l border-border/30 pl-4">
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" />
              Комменты
            </span>
            <span className="text-sm font-medium">{commentsCount}</span>
          </div>
        </div>
      </div>
    </Card>
  )
})

TaskItem.displayName = 'TaskItem'

export default TaskItem
