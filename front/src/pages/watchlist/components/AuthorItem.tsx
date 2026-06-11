import { Clock, User } from 'lucide-react'
import { type WatchlistAuthor } from '../../../shared/api/watchlist'
import { formatDateTime } from '../../../shared/utils/time'

type AuthorItemProps = {
  author: WatchlistAuthor
  isSelected: boolean
  onClick: () => void
}

export function AuthorItem({ author, isSelected, onClick }: AuthorItemProps) {
  const isStopped = author.status === 'STOPPED'
  const profile = author.author
  const name = profile ? profile.fullName : `VK ID: ${author.authorVkId}`

  return (
    <button
      onClick={onClick}
      className={`w-full p-3 text-left transition-colors duration-150 flex items-start gap-2.5 ${
        isSelected
          ? 'bg-accent-soft'
          : 'hover:bg-bg-hover'
      }`}
    >
      {profile?.photo50 ? (
        <img
          src={profile.photo50}
          alt={name}
          loading="lazy"
          decoding="async"
          className="w-8 h-8 rounded-full border border-border shrink-0"
        />
      ) : (
        <div className="w-8 h-8 rounded-full bg-border flex items-center justify-center text-text-secondary font-semibold text-xs shrink-0">
          <User size={14} />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <p className={`text-xs font-semibold truncate ${isSelected ? 'text-accent' : 'text-text-primary'}`}>
            {name}
          </p>
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isStopped ? 'bg-text-muted' : 'bg-success'}`} />
        </div>
        <p className="text-[10px] text-text-secondary truncate mt-0.5">
          {profile?.screenName ? `@${profile.screenName}` : `id${author.authorVkId}`}
        </p>
        
        <div className="flex items-center justify-between mt-2 text-[9px] text-text-muted">
          <span className="flex items-center gap-1">
            <Clock size={10} /> {formatDateTime(author.lastCheckedAt)}
          </span>
          {author.foundCommentsCount > 0 && (
            <span className="bg-bg-hover border border-border text-text-primary px-1.5 py-0.5 rounded font-mono">
              {author.foundCommentsCount}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}
