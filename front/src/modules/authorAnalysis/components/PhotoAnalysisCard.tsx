import { memo, useMemo } from 'react'
import { Card, CardContent } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { SuspicionLevelBadge } from './SuspicionLevelBadge'
import type { PhotoAnalysis } from '@/types'

interface PhotoAnalysisCardProps {
  analysis: PhotoAnalysis
}

const categoryLabels: Record<string, string> = {
  violence: 'Насилие',
  drugs: 'Наркотики',
  weapons: 'Оружие',
  nsfw: 'NSFW',
  extremism: 'Экстремизм',
  'hate speech': 'Разжигание ненависти',
}

const PhotoAnalysisCardComponent = ({ analysis }: PhotoAnalysisCardProps) => {
  const analyzedDate = useMemo(
    () =>
      new Date(analysis.analyzedAt).toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    [analysis.analyzedAt]
  )

  const confidencePercent =
    typeof analysis.confidence === 'number' ? Math.round(analysis.confidence) : null

  const vkPhotoUrl = useMemo(
    () => `https://vk.com/photo${analysis.photoVkId}`,
    [analysis.photoVkId]
  )

  return (
    <Card className="overflow-hidden border border-border/60 bg-background-secondary/90 shadow-soft-md">
      <div className="relative aspect-square">
        <a
          href={analysis.photoUrl}
          target="_blank"
          rel="noreferrer"
          className="block h-full w-full overflow-hidden"
        >
          <img
            src={analysis.photoUrl}
            alt={`Фото ${analysis.photoVkId}`}
            className="h-full w-full object-cover transition-transform duration-200 hover:scale-105"
            loading="lazy"
          />
        </a>
        {analysis.hasSuspicious && (
          <div className="absolute right-2 top-2">
            <Badge variant="destructive" className="shadow-lg">
              Подозрительно
            </Badge>
          </div>
        )}
        <div className="pointer-events-none absolute left-2 bottom-2 rounded-full border border-border/60 bg-background-primary/80 px-3 py-1 text-xs font-medium text-text-secondary shadow-soft-sm">
          Открыть фото
        </div>
      </div>

      <CardContent className="space-y-4 p-4">
        <div className="flex items-center justify-between gap-3">
          <SuspicionLevelBadge level={analysis.suspicionLevel} />
          <Button asChild variant="outline" size="sm">
            <a href={vkPhotoUrl} target="_blank" rel="noreferrer">
              Открыть во VK
            </a>
          </Button>
        </div>

        {analysis.categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {analysis.categories.map((category) => {
              const normalized = category.trim().toLowerCase()
              return (
                <Badge key={category} variant="outline" className="text-xs">
                  {categoryLabels[normalized] ?? category}
                </Badge>
              )
            })}
          </div>
        )}

        {analysis.explanation && (
          <p className="rounded-lg border border-border/40 bg-background-primary/60 p-3 text-sm leading-relaxed text-text-primary/90">
            {analysis.explanation}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-text-secondary">
          <span>{analyzedDate}</span>
          {confidencePercent !== null && (
            <span className="font-medium">Уверенность: {confidencePercent}%</span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export const PhotoAnalysisCard = memo(PhotoAnalysisCardComponent)
