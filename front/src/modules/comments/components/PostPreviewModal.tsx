import { ExternalLink, X } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import type { PostGroup } from '@/types'
import { highlightKeywords } from '@/modules/comments/utils/highlightKeywords'
import { CommentAttachments } from './CommentAttachments'
import type { Keyword } from '@/types'

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

  if (!isOpen) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md transition-opacity animate-in fade-in-0 duration-300"
      onClick={onClose}
    >
      <div
        className="relative flex w-full max-h-[90vh] max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900/95 shadow-2xl backdrop-blur-2xl animate-in zoom-in-95 fade-in-0 duration-300"
        role="dialog"
        aria-modal="true"
        aria-labelledby="post-preview-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Top border glow */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

        {/* Header */}
        <header className="flex items-start justify-between gap-4 border-b border-white/5 bg-slate-800/30 px-6 py-4">
          <div className="space-y-1.5">
            <h2
              id="post-preview-modal-title"
              className="font-monitoring-display text-xl font-bold tracking-tight text-white"
            >
              Превью <span className="text-cyan-400">Поста</span>
            </h2>
            <p className="font-monitoring-body text-sm text-slate-400">
              Полный текст поста и вложения
            </p>
          </div>
          <button
            type="button"
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
            onClick={onClose}
            aria-label="Закрыть модальное окно"
          >
            <X className="size-5" />
          </button>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="space-y-5">
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
                  className="group relative h-11 w-full overflow-hidden border-white/10 bg-slate-800/50 font-monitoring-body font-semibold text-white transition-all hover:border-cyan-400/50 hover:bg-slate-800"
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
        </div>

        {/* Bottom accent line */}
        <div className="h-0.5 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500" />
      </div>
    </div>
  )
}

// Default export для lazy loading
export default PostPreviewModal
