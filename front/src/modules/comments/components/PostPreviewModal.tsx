import { ExternalLink, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm transition-opacity"
      onClick={onClose}
    >
      <div
        className="flex w-full max-h-[90vh] max-w-3xl flex-col overflow-hidden rounded-3xl bg-card text-foreground shadow-2xl ring-1 ring-border"
        role="dialog"
        aria-modal="true"
        aria-labelledby="post-preview-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <header className="flex items-start justify-between gap-4 px-6 py-4 border-b border-border">
          <div className="space-y-1">
            <h2
              id="post-preview-modal-title"
              className="text-xl font-bold tracking-tight"
            >
              Превью поста
            </h2>
            <p className="text-sm text-muted-foreground">
              Полный текст поста и вложения
            </p>
          </div>
          <button
            type="button"
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            onClick={onClose}
            aria-label="Закрыть модальное окно"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-4">
            {/* Группа */}
            {postGroup && (
              <div className="flex items-center gap-3 pb-2">
                {postGroup.photo && (
                  <img
                    src={postGroup.photo}
                    alt={postGroup.name}
                    className="w-10 h-10 rounded-full border border-border/40"
                  />
                )}
                <div>
                  <div className="font-semibold text-foreground">{postGroup.name}</div>
                  {postGroup.screenName && (
                    <div className="text-xs text-muted-foreground">
                      @{postGroup.screenName}
                    </div>
                  )}
                </div>
              </div>
            )}

            <Separator />

            {/* Текст поста */}
            {postText && (
              <div className="text-base leading-relaxed whitespace-pre-wrap break-words text-foreground">
                {highlightKeywords(postText, keywords)}
              </div>
            )}

            {/* Вложения */}
            {attachments.length > 0 && (
              <div className="pt-2">
                <div className="text-sm font-semibold text-muted-foreground mb-3">
                  Вложения ({attachments.length})
                </div>
                <CommentAttachments attachments={attachments} />
              </div>
            )}

            {/* Кнопка открыть в VK */}
            {postUrl && (
              <div className="pt-4 border-t">
                <Button
                  variant="outline"
                  className="w-full"
                  asChild
                >
                  <a
                    href={postUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Открыть в VK
                  </a>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

