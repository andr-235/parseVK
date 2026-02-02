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

import { cn } from '@/shared/utils'
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
    <div className="relative">
      {/* Glow Effect */}
      <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-50" />

      <Card
        onClick={() => onSelect(task.id)}
        className="group relative overflow-hidden transition-all duration-300 cursor-pointer border border-white/10 bg-slate-900/80 backdrop-blur-2xl hover:shadow-xl hover:shadow-cyan-500/20 hover:scale-[1.02] active:scale-[0.98]"
      >
        {/* Top Border Glow */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />

        <div className="flex flex-col gap-4 p-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-monitoring-display font-semibold text-lg leading-none truncate text-white">
                  {task.title || `Задача #${task.id}`}
                </h3>
                <Badge
                  variant="outline"
                  className={cn(
                    'gap-1.5 h-6 rounded-full text-[11px] font-semibold tracking-wide font-mono-accent',
                    getStatusColor(task.status)
                  )}
                >
                  {getStatusIcon(task.status)}
                  {getTaskStatusText(task.status)}
                </Badge>
              </div>

              <div className="flex items-center gap-3 text-sm text-slate-400 font-mono-accent">
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
                  className="h-8 w-8 -mr-2 text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-48 border-white/10 bg-slate-900/95 backdrop-blur-2xl"
              >
                {(task.status === 'failed' || task.status === 'completed') && (
                  <DropdownMenuItem
                    onClick={handleResume}
                    className="text-slate-300 hover:text-white"
                  >
                    <RotateCw className="w-4 h-4 mr-2" />
                    Перезапустить
                  </DropdownMenuItem>
                )}
                {isActive && (
                  <DropdownMenuItem
                    onClick={handleCheck}
                    className="text-slate-300 hover:text-white"
                  >
                    <RotateCw className="w-4 h-4 mr-2" />
                    Проверить статус
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  className="text-rose-400 focus:text-rose-400 hover:bg-rose-500/10"
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
              <div className="flex justify-between text-xs font-medium text-slate-400 font-mono-accent">
                <span>Прогресс</span>
                <span className="text-cyan-400">{percent}%</span>
              </div>
              <ProgressBar
                current={progress.processed}
                total={progress.total}
                tone={progressTone}
                size="small"
                showLabel={false}
                className="gap-1.5"
              />
              <div className="flex justify-between text-xs text-slate-500 font-mono-accent">
                <span>
                  Обработано: {progress.processed} из {progress.total}
                </span>
                {progress.failed > 0 && (
                  <span className="text-rose-400">Ошибок: {progress.failed}</span>
                )}
              </div>
            </div>
          ) : (
            <Separator className="bg-white/10" />
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 pt-1">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-slate-500 flex items-center gap-1.5 font-mono-accent uppercase tracking-wider">
                <Users className="w-3.5 h-3.5" />
                Группы
              </span>
              <span className="text-sm font-medium text-slate-200">{groupsCount}</span>
            </div>

            <div className="flex flex-col gap-1 border-l border-white/10 pl-4">
              <span className="text-xs text-slate-500 flex items-center gap-1.5 font-mono-accent uppercase tracking-wider">
                <FileText className="w-3.5 h-3.5" />
                Посты
              </span>
              <span className="text-sm font-medium text-slate-200">{postsCount}</span>
            </div>

            <div className="flex flex-col gap-1 border-l border-white/10 pl-4">
              <span className="text-xs text-slate-500 flex items-center gap-1.5 font-mono-accent uppercase tracking-wider">
                <MessageSquare className="w-3.5 h-3.5" />
                Комменты
              </span>
              <span className="text-sm font-medium text-slate-200">{commentsCount}</span>
            </div>
          </div>

          {/* Bottom Accent Line */}
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-cyan-500/50 via-blue-500/50 to-purple-500/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
      </Card>
    </div>
  )
})

TaskItem.displayName = 'TaskItem'

export default TaskItem
