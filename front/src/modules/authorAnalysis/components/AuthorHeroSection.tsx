import { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import PageHeroCard from '@/components/PageHeroCard'
import type { AuthorDetails, PhotoAnalysisSummary } from '@/types'
import { formatDateTime } from '@/utils/authorAnalysisUtils'
import { PHOTO_ANALYSIS_LABELS } from '@/utils/photoAnalysisConstants'

interface AuthorHeroSectionProps {
  author: AuthorDetails | null
  summary: PhotoAnalysisSummary | null
  isAnalyzing: boolean
  isValidAuthor: boolean
  onAnalyze: (force?: boolean) => void
  onDelete: () => void
}

/**
 * Компонент секции героя для страницы анализа автора
 * Отображает информацию об авторе и основные действия
 */
export const AuthorHeroSection = ({
  author,
  summary,
  isAnalyzing,
  isValidAuthor,
  onAnalyze,
  onDelete,
}: AuthorHeroSectionProps) => {
  const heroFooter = useMemo(() => {
    if (!summary) {
      return null
    }

    const lastAnalyzed = formatDateTime(summary.lastAnalyzedAt)
    const verifiedAt = formatDateTime(author?.verifiedAt)
    const lastSeen = formatDateTime(author?.lastSeenAt)

    return (
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="border-accent-primary/30 bg-accent-primary/10 text-accent-primary">
          Фото: {summary.total}
        </Badge>
        <Badge variant="outline" className="border-destructive/30 bg-destructive/10 text-destructive">
          {PHOTO_ANALYSIS_LABELS.SUSPICIOUS_LABEL}: {summary.suspicious}
        </Badge>
        <Badge variant="outline" className="border-border/50">
          {PHOTO_ANALYSIS_LABELS.LAST_ANALYSIS_LABEL}: {lastAnalyzed}
        </Badge>
        <Badge variant="outline" className="border-border/50">
          Последний вход: {lastSeen}
        </Badge>
        <Badge variant="outline" className="border-border/50">
          Проверен: {verifiedAt}
        </Badge>
      </div>
    )
  }, [author?.lastSeenAt, author?.verifiedAt, summary])

  return (
    <PageHeroCard
      title={author ? author.fullName : 'Анализ фотографий'}
      description={
        author
          ? `Профиль VK ID ${author.vkUserId}. Следите за подозрительным контентом и запускайте анализ фотографий.`
          : 'Загружаем данные автора...'
      }
      footer={heroFooter}
      actions={
        <div className="flex flex-col gap-2 md:flex-row">
          <Button onClick={() => onAnalyze(false)} disabled={!isValidAuthor || isAnalyzing}>
            {isAnalyzing ? (
              <span className="flex items-center gap-2">
                <Spinner className="h-4 w-4" />
                Анализируем…
              </span>
            ) : (
              'Анализировать фото'
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => onAnalyze(true)}
            disabled={!isValidAuthor || isAnalyzing}
          >
            Повторить анализ
          </Button>
          <Button variant="destructive" onClick={onDelete} disabled={!isValidAuthor || isAnalyzing}>
            Очистить результаты
          </Button>
        </div>
      }
    />
  )
}