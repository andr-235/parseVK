import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import type { WatchlistAuthorCard } from '@/types'
import { WATCHLIST_CONSTANTS } from '@/constants/watchlist'


interface ActionsCellProps {
  item: WatchlistAuthorCard
  handleSelectAuthor: (id: number) => void
  handleRemoveFromWatchlist: (id: number) => void
  pendingRemoval: Record<number, boolean>
}

export const ActionsCell = ({
  item,
  handleSelectAuthor,
  handleRemoveFromWatchlist,
  pendingRemoval,
}: ActionsCellProps) => {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={(event) => {
          event.stopPropagation()
          handleSelectAuthor(item.id)
        }}
      >
        Подробнее
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={(event) => {
          event.stopPropagation()
          if (item.author) {
            navigate(`/authors/${item.author.vkUserId}/analysis`, {
              state: {
                author: item.author,
                summary: item.analysisSummary,
              },
            })
          }
        }}
      >
        Анализ фото
      </Button>
      {item.status !== WATCHLIST_CONSTANTS.STOPPED_STATUS ? (
        <Button
          type="button"
          variant="destructive"
          size="sm"
          disabled={Boolean(pendingRemoval[item.id])}
          onClick={(event) => {
            event.stopPropagation()
            handleRemoveFromWatchlist(item.id)
          }}
        >
          {pendingRemoval[item.id] && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {pendingRemoval[item.id] ? WATCHLIST_CONSTANTS.REMOVING_TEXT : WATCHLIST_CONSTANTS.REMOVE_TEXT}
        </Button>
      ) : null}
    </div>
  )
}