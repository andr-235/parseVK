import { Badge } from '@/components/ui/badge'
import { MessageSquare, CheckCircle2, Eye } from 'lucide-react'

interface CommentsHeroProps {
  totalCount: number
  readCount: number
  unreadCount: number
}

function CommentsHero({ totalCount, readCount, unreadCount }: CommentsHeroProps) {
  return (
    <div className="space-y-4">
      {/* Title and description */}
      <div className="space-y-2.5">
        <h1 className="font-monitoring-display text-3xl font-bold tracking-tight text-white">
          VK <span className="text-primary">Комментарии</span>
        </h1>
        <p className="max-w-2xl text-slate-300 font-monitoring-body">
          Управляйте обратной связью из сообществ и отслеживайте важные сообщения в реальном времени
        </p>
        {/* Decorative line */}
        <div className="h-px w-16 bg-linear-to-r from-primary/50 via-primary/80 to-transparent" />
      </div>

      {/* Metrics badges */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Total count - primary cyan badge */}
        <Badge className="flex items-center gap-2 border border-primary/20 bg-primary/10 px-4 py-2 font-mono-accent text-sm text-primary shadow-soft-sm">
          <MessageSquare className="size-4" />
          <span className="font-semibold">{totalCount.toLocaleString('ru-RU')}</span>
          <span className="text-xs text-primary/70">всего</span>
        </Badge>

        {/* Unread - accent badge */}
        <Badge className="flex items-center gap-2 border border-border/60 bg-background-secondary px-4 py-2 font-mono-accent text-sm text-white transition-all duration-200 hover:border-primary/50 hover:bg-background-secondary/85">
          <Eye className="size-4" />
          <span className="font-semibold">{unreadCount.toLocaleString('ru-RU')}</span>
          <span className="text-xs text-slate-400">непрочитано</span>
        </Badge>

        {/* Read - secondary badge */}
        <Badge className="flex items-center gap-2 border border-border/60 bg-background-secondary/50 px-4 py-2 font-mono-accent text-sm text-slate-400 transition-all duration-200 hover:border-green-500/30">
          <CheckCircle2 className="size-4 text-green-500/70" />
          <span className="font-semibold">{readCount.toLocaleString('ru-RU')}</span>
          <span className="text-xs">прочитано</span>
        </Badge>
      </div>
    </div>
  )
}

export default CommentsHero
