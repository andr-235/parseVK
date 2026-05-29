import { ExternalLink } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
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

export function PostPreviewModal({
  isOpen,
  postText,
  postAttachments,
  postGroup,
  postUrl,
  keywords = [],
  onClose,
}: PostPreviewModalProps) {
  const attachments = Array.isArray(postAttachments) ? postAttachments : []

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
          <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-slate-800/30 p-3">
            {postGroup.photo && (
              <img
                src={postGroup.photo}
                alt={postGroup.name}
                className="size-10 rounded-full border border-white/10"
                loading="lazy"
              />
            )}
            <div className="min-w-0 flex-1">
              <div className="font-monitoring-display text-sm font-semibold text-white">
                {postGroup.name}
              </div>
              {postGroup.screenName && (
                <div className="font-mono-accent text-xs text-slate-500">
                  @{postGroup.screenName}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Decorative separator */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        {/* Post text */}
        {postText && (
          <div className="whitespace-pre-wrap break-words font-monitoring-body text-base leading-relaxed text-slate-200">
            {highlightKeywords(postText, keywords)}
          </div>
        )}

        {/* Attachments */}
        {attachments.length > 0 && (
          <div className="space-y-3 rounded-lg border border-white/10 bg-slate-800/20 p-4">
            <div className="font-mono-accent text-xs font-semibold uppercase tracking-wider text-slate-400">
              Вложения ({attachments.length})
            </div>
            <CommentAttachments attachments={attachments} />
          </div>
        )}

        {/* Open in VK button */}
        {postUrl && (
          <div className="border-t border-white/5 pt-4">
            <Button
              variant="outline"
              className="group relative h-11 w-full overflow-hidden border-[#2a2a30] bg-[#1c1c21] font-monitoring-body font-semibold text-white transition-all hover:border-accent-primary/50 hover:bg-slate-800"
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
}

export default PostPreviewModal
