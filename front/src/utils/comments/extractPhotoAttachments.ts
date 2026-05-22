export type GalleryPhoto = {
  url: string
}

export function extractPhotoAttachments(attachments: unknown[]): GalleryPhoto[] {
  if (!Array.isArray(attachments)) return []

  return attachments
    .map((attachment) => {
      if (!attachment || typeof attachment !== 'object') return null

      const att = attachment as Record<string, unknown>
      if (att.type !== 'photo') return null

      const photo = att.photo as Record<string, unknown> | undefined
      if (!photo) return null

      const sizes = Array.isArray(photo.sizes)
        ? (photo.sizes as Array<Record<string, unknown>>)
        : []

      const largestSize = sizes.reduce<Record<string, unknown> | null>((max, size) => {
        const maxWidth = typeof max?.width === 'number' ? max.width : 0
        const currentWidth = typeof size?.width === 'number' ? size.width : 0
        return currentWidth > maxWidth ? size : max
      }, null)

      const url =
        (largestSize?.url as string | undefined) ||
        (photo.photo_807 as string | undefined) ||
        (photo.photo_604 as string | undefined)

      return url ? { url } : null
    })
    .filter((photo): photo is GalleryPhoto => photo !== null)
}
