import { motion } from 'framer-motion'
import { Button } from '@/shared/ui/button'
import { Card, CardHeader, CardContent, CardDescription } from '@/shared/ui/card'
import type { IListing } from '@/types/api'
import { cn } from '@/shared/utils'
import { ExternalLink, MapPin, Phone, Calendar, Tag } from 'lucide-react'

const SOURCE_TITLE_MAP: Record<string, string> = {
  avito: 'Авито',
  youla: 'Юла',
  юла: 'Юла',
  avto: 'Авто',
}

const formatSourceLabel = (value?: string | null): string => {
  if (!value) return 'Не указан'
  const key = value.toLowerCase()
  if (SOURCE_TITLE_MAP[key]) return SOURCE_TITLE_MAP[key]
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^[a-zа-яё]|\s[a-zа-яё]/gi, (match) => match.toUpperCase())
}

const formatPrice = (price: number | null | undefined, currency?: string | null): string => {
  if (price == null) return '—'
  const formatter = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 })
  if (!currency) return formatter.format(price)
  try {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: currency.toUpperCase(),
      maximumFractionDigits: 0,
    }).format(price)
  } catch {
    return `${formatter.format(price)} ${currency}`
  }
}

const formatArea = (value: number | null | undefined): string | null => {
  if (value == null) return null
  return `${new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 }).format(value)} м²`
}

const formatDateTime = (value?: string | null): string => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date)
  } catch {
    return date.toLocaleString('ru-RU')
  }
}

const formatDateTimeWithFallback = (primary?: string | null, fallback?: string | null): string => {
  if (primary) {
    const formatted = formatDateTime(primary)
    if (formatted !== '—') return formatted
  }
  if (fallback && fallback.trim().length > 0) return fallback
  return '—'
}

const buildParameters = (listing: IListing): string | null => {
  const parts: string[] = []
  if (listing.rooms != null) parts.push(`${listing.rooms} комн.`)
  if (listing.areaTotal != null) {
    const area = formatArea(listing.areaTotal)
    if (area) parts.push(area)
  }
  if (listing.floor != null) {
    if (listing.floorsTotal != null) {
      parts.push(`${listing.floor}/${listing.floorsTotal} этаж`)
    } else {
      parts.push(`${listing.floor} этаж`)
    }
  } else if (listing.floorsTotal != null) {
    parts.push(`из ${listing.floorsTotal} этажей`)
  }
  return parts.length === 0 ? null : parts.join(' • ')
}

const MotionCard = motion(Card)

interface ListingCardProps {
  listing: IListing
  expandedDescriptions: Set<number>
  onToggleDescription: (id: number) => void
  onAddNote: (listing: IListing) => void
  onArchive: (listing: IListing) => void
  shouldAnimate?: boolean
  staggerDelay?: number
}

export function ListingCard({
  listing,
  expandedDescriptions,
  onToggleDescription,
  onAddNote,
  onArchive,
  shouldAnimate = false,
  staggerDelay = 0,
}: ListingCardProps) {
  const parameters = buildParameters(listing)
  const livingArea = formatArea(listing.areaLiving)
  const kitchenArea = formatArea(listing.areaKitchen)
  const primaryImage = listing.images.find((image) => image && image.trim().length > 0)
  const sourcePostedAt = listing.sourcePostedAt ?? null
  const contactName = listing.contactName ?? listing.sourceAuthorName ?? null
  const contactPhone = listing.contactPhone ?? listing.sourceAuthorPhone ?? null
  const publishedDisplay = formatDateTimeWithFallback(listing.publishedAt, sourcePostedAt)
  const descriptionText = listing.description?.trim() ?? ''
  const hasDescription = descriptionText.length > 0
  const shouldAllowToggle = descriptionText.length > 240
  const isDescriptionExpanded = expandedDescriptions.has(listing.id)

  return (
    <MotionCard
      layout
      initial={shouldAnimate ? { opacity: 0, y: 12 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.24,
        ease: 'easeOut',
        delay: shouldAnimate ? staggerDelay : 0,
      }}
      className="group flex h-full flex-col overflow-hidden border-border/50 bg-background-secondary shadow-soft-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-accent-primary/5"
    >
      {primaryImage && (
        <div className="relative h-52 w-full overflow-hidden bg-muted">
          <img
            src={primaryImage}
            alt={listing.title ?? 'Объявление'}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          {listing.images.length > 1 && (
            <div className="absolute right-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-md">
              {listing.images.length} фото
            </div>
          )}
          <div className="absolute left-3 top-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-text-primary shadow-sm backdrop-blur-md dark:bg-black/60 dark:text-white">
              <Tag className="h-3 w-3" />
              {formatSourceLabel(listing.source ?? null)}
            </span>
          </div>
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-2 flex-1 text-lg font-semibold leading-tight text-text-primary transition-colors group-hover:text-accent-primary">
              {listing.title ?? 'Без названия'}
            </h3>
            {listing.url && (
              <a
                href={listing.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 text-text-tertiary transition-colors hover:text-accent-primary"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="h-4.5 w-4.5" />
              </a>
            )}
          </div>

          {listing.price != null && (
            <div className="text-2xl font-bold text-accent-primary">
              {formatPrice(listing.price, listing.currency)}
            </div>
          )}

          {(parameters || livingArea || kitchenArea) && (
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-text-secondary">
              {parameters && <span className="font-medium text-text-primary">{parameters}</span>}
              {livingArea && <span>Жилая {livingArea}</span>}
              {kitchenArea && <span>Кухня {kitchenArea}</span>}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4 pt-0">
        {hasDescription && (
          <div className="space-y-1.5">
            <CardDescription className="text-sm leading-relaxed">
              <p
                className={cn(
                  'whitespace-pre-line text-text-secondary',
                  !isDescriptionExpanded && shouldAllowToggle && 'line-clamp-3'
                )}
              >
                {descriptionText}
              </p>
            </CardDescription>
            {shouldAllowToggle && (
              <button
                type="button"
                onClick={() => onToggleDescription(listing.id)}
                className="text-xs font-medium text-accent-primary transition-colors hover:text-accent-primary/80"
              >
                {isDescriptionExpanded ? 'Свернуть описание' : 'Показать полностью'}
              </button>
            )}
          </div>
        )}

        <div className="mt-auto space-y-4">
          {(listing.city || listing.address) && (
            <div className="flex items-start gap-2.5 text-sm">
              <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-text-tertiary" />
              <div className="flex-1 space-y-0.5">
                {listing.city && (
                  <div className="font-medium text-text-primary">{listing.city}</div>
                )}
                {listing.address && <div className="text-text-secondary">{listing.address}</div>}
              </div>
            </div>
          )}

          {(contactName || contactPhone) && (
            <div className="flex items-start gap-2.5 text-sm">
              <Phone className="mt-0.5 h-4 w-4 flex-shrink-0 text-text-tertiary" />
              <div className="flex-1 space-y-0.5">
                {contactName && <div className="font-medium text-text-primary">{contactName}</div>}
                {contactPhone && (
                  <a href={`tel:${contactPhone}`} className="text-accent-primary hover:underline">
                    {contactPhone}
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-4 border-t border-border/50 pt-3 text-xs text-text-tertiary">
          {publishedDisplay !== '—' && (
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              <span>{publishedDisplay}</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="h-8 flex-1 text-xs"
            onClick={(event) => {
              event.stopPropagation()
              onAddNote(listing)
            }}
          >
            {listing.manualNote ? 'Заметка' : 'Заметка'}
          </Button>

          {!listing.archived && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 flex-1 text-xs"
              onClick={(event) => {
                event.stopPropagation()
                onArchive(listing)
              }}
            >
              В архив
            </Button>
          )}
        </div>

        {listing.manualNote && (
          <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 px-3 py-2 text-xs text-text-secondary">
            <p className="line-clamp-2 font-medium text-yellow-600 dark:text-yellow-400">
              {listing.manualNote}
            </p>
          </div>
        )}
      </CardContent>
    </MotionCard>
  )
}

export function ListingSkeleton() {
  return (
    <Card className="h-full overflow-hidden border-border/50 bg-background-secondary shadow-soft-sm">
      <div className="h-52 w-full animate-pulse bg-muted" />
      <CardContent className="space-y-4 py-5">
        <div className="space-y-2">
          <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-full animate-pulse rounded bg-muted" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
        </div>
        <div className="flex gap-3 pt-4">
          <div className="h-8 w-full animate-pulse rounded bg-muted" />
        </div>
      </CardContent>
    </Card>
  )
}
