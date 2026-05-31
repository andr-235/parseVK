import { memo, useMemo } from 'react'
import { BookmarkPlus, ExternalLink, Eye } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Spinner } from '@/shared/components/ui/spinner'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip'
import { cn } from '@/shared/utils'

interface CommentActionsProps {
  commentUrl?: string | null
  isRead: boolean
  isWatchlisted?: boolean
  isWatchlistLoading?: boolean
  onAddToWatchlist?: () => void
  onToggleRead: () => void
}

export const CommentActions = memo(function CommentActions({
  commentUrl,
  isRead,
  isWatchlisted,
  isWatchlistLoading,
  onAddToWatchlist,
  onToggleRead,
}: CommentActionsProps) {
  const actions = useMemo(() => {
    const items: Array<{
      key: string
      ariaLabel: string
      tooltip: string
      disabled?: boolean
      icon: React.ReactNode
      onClick?: () => void
      href?: string
      className: string
    }> = []

    if (commentUrl) {
      items.push({
        key: 'vk-link',
        ariaLabel: 'Открыть в VK',
        tooltip: 'Открыть в VK',
        icon: <ExternalLink className="size-3.5" />,
        href: commentUrl,
        className: 'hover:bg-background-primary/40 hover:text-accent-info',
      })
    }

    items.push({
      key: 'read-toggle',
      ariaLabel: isRead ? 'Отметить как непрочитанное' : 'Отметить прочитанным',
      tooltip: isRead ? 'Непрочитано' : 'Прочитано',
      icon: <Eye className="size-3.5" />,
      onClick: onToggleRead,
      className: 'hover:bg-background-primary/40 hover:text-white',
    })

    if (onAddToWatchlist) {
      items.push({
        key: 'watchlist',
        ariaLabel: isWatchlisted ? 'В списке наблюдения' : 'Добавить в список',
        tooltip: isWatchlisted ? 'В списке' : 'На карандаш',
        disabled: isWatchlisted || Boolean(isWatchlistLoading),
        icon: isWatchlistLoading ? (
          <Spinner className="size-3" />
        ) : (
          <BookmarkPlus className={cn('size-3.5', isWatchlisted && 'fill-current text-accent-info/50')} />
        ),
        onClick: onAddToWatchlist,
        className: 'hover:bg-background-primary/40 hover:text-accent-info',
      })
    }

    return items
  }, [commentUrl, isRead, isWatchlisted, isWatchlistLoading, onAddToWatchlist, onToggleRead])

  return (
    <TooltipProvider>
      <div className="flex items-center gap-0.5 text-text-secondary/50">
        {actions.map((action) => (
          <Tooltip key={action.key}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={action.ariaLabel}
                disabled={action.disabled}
                onClick={action.onClick}
                className={`size-7 ${action.className}`}
                {...(action.href ? { asChild: true } : {})}
              >
                {action.href ? (
                  <a href={action.href} target="_blank" rel="noopener noreferrer">
                    {action.icon}
                  </a>
                ) : (
                  action.icon
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent className="border-border bg-background-secondary shadow-soft-md">
              {action.tooltip}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  )
})
