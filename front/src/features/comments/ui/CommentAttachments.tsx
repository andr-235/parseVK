import { Video, ExternalLink, Link as LinkIcon } from 'lucide-react'

interface CommentAttachmentsProps {
  attachments: unknown[]
}

export function CommentAttachments({ attachments }: CommentAttachmentsProps) {
  if (!attachments || !Array.isArray(attachments) || attachments.length === 0) {
    return null
  }

  const renderAttachment = (attachment: unknown) => {
    if (!attachment || typeof attachment !== 'object') return null

    const att = attachment as Record<string, unknown>
    const type = att.type as string

    if (type === 'photo') {
      const photo = att.photo as Record<string, unknown>
      const sizes = (photo?.sizes as Array<Record<string, unknown>>) || []
      const largestSize = sizes.reduce((max, size) => {
        const maxWidth = (max?.width as number) || 0
        const currentWidth = (size?.width as number) || 0
        return currentWidth > maxWidth ? size : max
      }, sizes[0] || {})
      const photoUrl =
        (largestSize?.url as string) || (photo?.photo_604 as string) || (photo?.photo_807 as string)
      const photoId = (photo?.id as number) || (photo?.pid as number)

      if (!photoUrl) return null

      return (
        <a
          key={`photo-${photoId || Math.random()}`}
          href={photoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-xl overflow-hidden border border-border/40 hover:border-primary/50 transition-all hover:shadow-sm group/media"
        >
          <img
            src={photoUrl}
            alt="Фото из поста"
            className="w-full h-auto max-h-96 object-contain bg-muted/10"
            loading="lazy"
          />
        </a>
      )
    }

    if (type === 'video') {
      const video = att.video as Record<string, unknown>
      const videoId = (video?.id as number) || (video?.vid as number)
      const ownerId = (video?.owner_id as number) || (video?.oid as number)
      const accessKey = (video?.access_key as string) || ''
      const title = (video?.title as string) || 'Видео'
      const thumb =
        (video?.photo_320 as string) || (video?.photo_640 as string) || (video?.image as string)

      return (
        <div
          key={`video-${videoId || Math.random()}`}
          className="flex items-center gap-3 rounded-xl border border-border/40 p-3 bg-muted/20 hover:bg-muted/30 transition-colors"
        >
          {thumb && (
            <div className="relative group/video shrink-0">
              <img
                src={thumb}
                alt={title}
                className="w-24 h-16 object-cover rounded-lg"
                loading="lazy"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover/video:bg-black/10 transition-colors rounded-lg">
                <Video className="h-6 w-6 text-white drop-shadow-md" />
              </div>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <span className="truncate">{title}</span>
            </div>
            {ownerId && videoId && (
              <a
                href={`https://vk.com/video${ownerId}_${videoId}${accessKey ? `_${accessKey}` : ''}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1 mt-1.5 transition-colors"
              >
                Смотреть видео
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      )
    }

    if (type === 'link') {
      const link = att.link as Record<string, unknown>
      const url = (link?.url as string) || ''
      const title = (link?.title as string) || (link?.caption as string) || 'Ссылка'
      const description = (link?.description as string) || ''
      const photo = (link?.photo as Record<string, unknown>) || null
      const photoUrl = photo ? (photo?.photo_604 as string) || (photo?.photo_807 as string) : null

      if (!url) return null

      return (
        <a
          key={`link-${url}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-start gap-3 rounded-xl border border-border/40 p-3 bg-muted/20 hover:bg-muted/30 hover:border-primary/30 transition-all"
        >
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={title}
              className="w-20 h-20 object-cover rounded-lg shrink-0"
              loading="lazy"
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <LinkIcon className="h-5 w-5 text-primary" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <span className="truncate">{title}</span>
            </div>
            {description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{description}</p>
            )}
            <span className="text-[10px] text-muted-foreground/60 mt-1.5 block truncate">
              {url}
            </span>
          </div>
        </a>
      )
    }

    return null
  }

  return (
    <div className="flex flex-wrap gap-2 pt-1">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
        {attachments.map((attachment) => renderAttachment(attachment)).filter(Boolean)}
      </div>
    </div>
  )
}
