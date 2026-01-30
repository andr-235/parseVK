import { useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { cn } from '@/shared/utils'
import {
  extractPhotoAttachments,
  type GalleryPhoto,
} from '@/modules/comments/utils/extractPhotoAttachments'

interface AttachmentsGalleryProps {
  attachments: unknown[]
  className?: string
}

export function AttachmentsGallery({ attachments, className }: AttachmentsGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const photos: GalleryPhoto[] = extractPhotoAttachments(attachments)

  if (photos.length === 0) {
    return null
  }

  const selectedPhoto = selectedIndex !== null ? photos[selectedIndex] : null

  return (
    <>
      <div className={cn('grid grid-cols-2 sm:grid-cols-3 gap-2', className)}>
        {photos.map((photo, index) => (
          <button
            key={photo.url}
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
