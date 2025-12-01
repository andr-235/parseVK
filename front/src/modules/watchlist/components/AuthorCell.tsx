import type { WatchlistAuthorCard } from '@/types'
import { WATCHLIST_CONSTANTS } from '../constants/watchlist'


interface AuthorCellProps {
  item: WatchlistAuthorCard
}

export const AuthorCell = ({ item }: AuthorCellProps) => {
  if (!item.author) {
    return <span className="text-text-secondary">{WATCHLIST_CONSTANTS.AUTHOR_NOT_FOUND}</span>
  }
  return (
    <div className="flex flex-col">
      <span className="font-medium text-text-primary">{item.author.fullName}</span>
      <a
        href={item.author.profileUrl ?? undefined}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-text-secondary hover:text-primary"
      >
        {WATCHLIST_CONSTANTS.VK_BASE_URL}{item.author.vkUserId}
      </a>
    </div>
  )
}