type BaseAttachment = {
  type: 'photo' | 'video' | 'link'
}

export type PhotoAttachment = BaseAttachment & {
  type: 'photo'
  url: string
  id?: number
}

export type VideoAttachment = BaseAttachment & {
  type: 'video'
  id?: number
  ownerId?: number
  accessKey?: string
  title: string
  thumb?: string
}

export type LinkAttachment = BaseAttachment & {
  type: 'link'
  url: string
  title: string
  description?: string
  photoUrl?: string
}

export type CommentAttachment = PhotoAttachment | VideoAttachment | LinkAttachment

export function extractCommentAttachments(attachments: unknown[]): CommentAttachment[] {
  if (!Array.isArray(attachments)) return []

  return attachments.flatMap((attachment): CommentAttachment[] => {
    if (!attachment || typeof attachment !== 'object') return []

    const att = attachment as Record<string, unknown>
    const type = att.type as string

    if (type === 'photo') {
      const photo = att.photo as Record<string, unknown>
      const sizes = Array.isArray(photo?.sizes)
        ? (photo.sizes as Array<Record<string, unknown>>)
        : []
      const largestSize = sizes.reduce<Record<string, unknown> | null>((max, size) => {
        const maxWidth = typeof max?.width === 'number' ? max.width : 0
        const currentWidth = typeof size?.width === 'number' ? size.width : 0
        return currentWidth > maxWidth ? size : max
      }, null)

      const photoUrl =
        (largestSize?.url as string | undefined) ||
        (photo?.photo_604 as string | undefined) ||
        (photo?.photo_807 as string | undefined)
      const photoId = (photo?.id as number) || (photo?.pid as number)

      if (!photoUrl) return []

      return [{ type: 'photo', url: photoUrl, id: photoId }]
    }

    if (type === 'video') {
      const video = att.video as Record<string, unknown>
      const videoId = (video?.id as number) || (video?.vid as number)
      const ownerId = (video?.owner_id as number) || (video?.oid as number)
      const accessKey = (video?.access_key as string) || ''
      const title = (video?.title as string) || 'Видео'
      const thumb =
        (video?.photo_320 as string) || (video?.photo_640 as string) || (video?.image as string)

      return [
        {
          type: 'video',
          id: videoId,
          ownerId,
          accessKey,
          title,
          thumb,
        },
      ]
    }

    if (type === 'link') {
      const link = att.link as Record<string, unknown>
      const url = (link?.url as string) || ''
      const title = (link?.title as string) || (link?.caption as string) || 'Ссылка'
      const description = (link?.description as string) || ''
      const photo = (link?.photo as Record<string, unknown>) || null
      const photoUrl = photo ? (photo?.photo_604 as string) || (photo?.photo_807 as string) : null

      if (!url) return []

      return [
        {
          type: 'link',
          url,
          title,
          description,
          photoUrl: photoUrl || undefined,
        },
      ]
    }

    return []
  })
}
