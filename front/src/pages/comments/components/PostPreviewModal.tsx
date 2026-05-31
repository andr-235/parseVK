import { memo } from 'react'
import { ExternalLink } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { ensureArray } from '@/shared/utils'
import type { PostGroup } from '@/shared/types'
import { highlightKeywords } from '@/shared/utils/highlightKeywords'
import { CommentAttachments } from './CommentAttachments'
import type { Keyword } from '@/shared/types'
import { FormModal } from '@/shared/components/common/FormModal'

interface PostPreviewModalProps {
  isOpen: boolean
  postText: string | null
  postAttachments: unknown
  postGroup: PostGroup | null
  postUrl?: string | null
  keywords?: Keyword[]
  onClose: () => void
}

const PostPreviewModal = memo(function PostPreviewModal({
  isOpen,
  postText,
  postAttachments,
  postGroup,
  postUrl,
  keywords = [],
  onClose,
}: PostPreviewModalProps) {
  const attachments = ensureArray(postAttachments)

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <>
          Превью <span className="text-accent-primary font-bold">Поста</span>
        </>
      }
      description="Полный текст поста и вложения"
      widthClass="max-w-3xl"
    >
      <div className="space-y-5 pt-2">
        {/* Post group */}
        {postGroup && (
          <div className="flex items-center gap-3 rounded-lg border border-border/10 bg-background-primary/30 p-3">
            {postGroup.photo && (
              <img
                src={postGroup.photo}
                alt={postGroup.name}
                className="size-10 rounded-full border border-border/10"
                loading="lazy"
              />
            )}
            <div className="min-w-0 flex-1">
              <div className="font-monitoring-display text-sm font-semibold text-text-light">
                {postGroup.name}
              </div>
              {postGroup.screenName && (
                <div className="font-mono-accent text-xs text-text-secondary/70">
                  @{postGroup.screenName}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Separator */}
        <div className="h-px bg-border/30" />

        {/* Post text */}
        {postText && (
          <div className="whitespace-pre-wrap break-words font-monitoring-body text-base leading-relaxed text-text-primary">
            {highlightKeywords(postText, keywords)}
          </div>
        )}

        {/* Attachments */}
        {attachments.length > 0 && (
          <div className="space-y-3 rounded-lg border border-border/10 bg-background-primary/20 p-4">
            <div className="font-mono-accent text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Вложения ({attachments.length})
            </div>
            <CommentAttachments attachments={attachments} />
          </div>
        )}

        {/* Open in VK button */}
        {postUrl && (
          <div className="border-t border-border/10 pt-4">
            <Button
              variant="outline"
              className="group relative h-11 w-full overflow-hidden border-border bg-background-secondary font-monitoring-body font-semibold text-text-light transition-all hover:border-accent-primary/50 hover:bg-background-primary/40"
              asChild
            >
              <a href={postUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 size-4 transition-transform group-hover:scale-110" />
                Открыть в VK
              </a>
            </Button>
          </div>
        )}
      </div>
    </FormModal>
  )
})

export default PostPreviewModal
