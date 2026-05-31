import { memo } from 'react'
import { Maximize2 } from 'lucide-react'

interface CommentPostContextProps {
  groupName?: string | null
  groupPhoto?: string | null
  postText?: string | null
  onOpenPostModal: () => void
}

export const CommentPostContext = memo(function CommentPostContext({
  groupName,
  groupPhoto,
  postText,
  onOpenPostModal,
}: CommentPostContextProps) {
  return (
    <div className="flex min-w-0 shrink-0 items-center gap-1.5 lg:w-56">
      {groupPhoto && (
        <img
          src={groupPhoto}
          alt=""
          className="size-4 shrink-0 rounded-full"
          loading="lazy"
        />
      )}
      <span className="truncate text-xs text-text-secondary">
        {groupName && (
          <span className="font-medium text-text-secondary/80">{groupName}</span>
        )}
        {postText && (
          <>
            {groupName && <span className="mx-1 text-text-secondary/40">·</span>}
            <span className="text-text-secondary/60">{postText.slice(0, 60)}</span>
          </>
        )}
      </span>
      <button
        type="button"
        onClick={onOpenPostModal}
        className="shrink-0 text-text-secondary/50 transition-colors hover:text-text-light"
        aria-label="Открыть полный текст поста"
      >
        <Maximize2 className="size-3" />
      </button>
    </div>
  )
})
