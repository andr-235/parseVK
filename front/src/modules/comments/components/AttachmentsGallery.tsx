import { useState } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface AttachmentsGalleryProps {
  attachments: unknown[]
  className?: string
}

function extractPhotoUrl(attachment: unknown): string | null {
  if (!attachment || typeof attachment !== 'object') return null

  const att = attachment as Record<string, unknown>
  if (att.type !== 'photo') return null

  const photo = att.photo as Record<string, unknown> | undefined
  if (!photo) return null

  const sizes = (photo.sizes as Array<Record<string, unknown>>) || []
  const largestSize = sizes.reduce((max, size) => {
    const maxWidth = (max?.width as number) || 0
    const currentWidth = (size?.width as number) || 0
    return currentWidth > maxWidth ? size : max
  }, sizes[0] || {})

  return (
    (largestSize?.url as string) ||
    (photo.photo_807 as string) ||
    (photo.photo_604 as string) ||
    null
  )
}

export function AttachmentsGallery({ attachments, className }: AttachmentsGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  const photos = attachments
    .map((att) => {
      const url = extractPhotoUrl(att)
      return url ? { url, attachment: att } : null
    })
    .filter((item): item is { url: string; attachment: unknown } => item !== null)

  if (photos.length === 0) {
    return null
  }

  const selectedPhoto = selectedIndex !== null ? photos[selectedIndex] : null

  return (
    <>
      <div className={cn('grid grid-cols-2 sm:grid-cols-3 gap-2', className)}>
        {photos.map((photo, index) => (
          <button
            key={index}
            onClick={() => setSelectedIndex(index)}
            className="relative aspect-square rounded-lg overflow-hidden border border-border/40 hover:border-primary/50 transition-all group"
          >
            <img
              src={photo.url}
              alt={`Вложение ${index + 1}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          </button>
        ))}
      </div>

      {/* Модальное окно для просмотра фото */}
      {selectedIndex !== null && selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          onClick={() => setSelectedIndex(null)}
        >
          <div
            className="relative w-full max-w-5xl max-h-[90vh]"
            onClick={(event) => event.stopPropagation()}
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
              onClick={() => setSelectedIndex(null)}
            >
              <X className="h-5 w-5" />
            </Button>

            <div className="flex items-center justify-center min-h-[60vh] p-4">
              <img
                src={selectedPhoto.url}
                alt={`Вложение ${selectedIndex + 1}`}
                className="max-w-full max-h-[80vh] object-contain"
              />
            </div>

            {photos.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20"
                  onClick={() =>
                    setSelectedIndex(selectedIndex > 0 ? selectedIndex - 1 : photos.length - 1)
                  }
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20"
                  onClick={() =>
                    setSelectedIndex(selectedIndex < photos.length - 1 ? selectedIndex + 1 : 0)
                  }
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 text-white text-sm">
                  {selectedIndex + 1} / {photos.length}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
