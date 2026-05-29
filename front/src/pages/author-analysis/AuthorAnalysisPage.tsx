import { memo, useMemo } from 'react'
import { useAuthorData } from '@/pages/authors/hooks/useAuthorData'
import { usePhotoAnalysis } from '@/pages/author-analysis/hooks/usePhotoAnalysis'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { PageHeader, SectionCard } from '@/components/common'
import type { AuthorDetails, PhotoAnalysis, PhotoAnalysisSummary, SuspicionLevel } from '@/types'
import { categoryLabels, formatDateTime } from '@/pages/author-analysis/utils/authorAnalysisUtils'
import { PHOTO_ANALYSIS_LABELS } from '@/pages/author-analysis/config/photoAnalysisConstants'

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'highlight'

interface SuspicionLevelBadgeProps {
  level: SuspicionLevel
  className?: string
}

const suspicionConfig: Record<SuspicionLevel, { label: string; variant: BadgeVariant }> = {
  NONE: { label: 'Не обнаружено', variant: 'secondary' },
  LOW: { label: 'Низкий', variant: 'outline' },
  MEDIUM: { label: 'Средний', variant: 'default' },
  HIGH: { label: 'Высокий', variant: 'destructive' },
}

function SuspicionLevelBadge({ level, className }: SuspicionLevelBadgeProps) {
  const { label, variant } = suspicionConfig[level]

  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  )
}

interface PhotoAnalysisCardProps {
  analysis: PhotoAnalysis
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

const PhotoAnalysisCard = memo(PhotoAnalysisCardComponent)

interface PhotosSectionProps {
  analyses: PhotoAnalysis[]
  isLoading: boolean
  filter: 'all' | 'suspicious'
  onFilterChange: (filter: 'all' | 'suspicious') => void
}

function PhotosSection({
  analyses,
  isLoading,
  filter,
  onFilterChange,
}: PhotosSectionProps) {
  return (
    <SectionCard
      title="Фотографии"
      description="Результаты анализа каждого изображения."
      headerActions={
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onFilterChange('all')}
          >
            Все
          </Button>
          <Button
            variant={filter === 'suspicious' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onFilterChange('suspicious')}
          >
            Подозрительные
          </Button>
        </div>
      }
    >
      {isLoading ? (
        <div className="flex justify-center py-10">
          <Spinner className="h-6 w-6" />
        </div>
      ) : null}

      {!isLoading && analyses.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/60 bg-background-primary/40 px-6 py-12 text-center text-text-secondary">
          <p className="text-lg font-medium text-text-primary">
            {filter === 'suspicious'
              ? 'Подозрительные фото не найдены'
              : 'Результаты анализа отсутствуют'}
          </p>
          <p className="max-w-md text-sm">
            {filter === 'suspicious'
              ? 'Попробуйте просмотреть все фото или повторно выполнить анализ.'
              : 'Запустите анализ фотографий, чтобы увидеть результаты.'}
          </p>
        </div>
      ) : null}

      {analyses.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {analyses.map((analysis) => (
            <PhotoAnalysisCard key={analysis.id} analysis={analysis} />
          ))}
        </div>
      ) : null}
    </SectionCard>
  )
}

interface AnalysisSummarySectionProps {
  author: AuthorDetails | null
  summary: PhotoAnalysisSummary | null
  isAuthorLoading: boolean
  onVerifyAuthor?: () => void
}

function AnalysisSummarySection({
  author,
  summary,
  isAuthorLoading,
  onVerifyAuthor,
}: AnalysisSummarySectionProps) {
  const categories = useMemo(() => summary?.categories ?? [], [summary?.categories])

  return (
    <SectionCard
      title="Сводка анализа"
      description="Основные категории и уровни подозрительного контента по фотографиям автора."
    >
      {isAuthorLoading ? (
        <div className="flex justify-center py-6">
          <Spinner className="h-6 w-6" />
        </div>
      ) : null}

      {author ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <div className="space-y-2">
              <p className="text-sm font-medium text-text-primary">Основные тематики</p>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => {
                  const label = categoryLabels[category.name.toLowerCase()] ?? category.name
                  const hasFindings = category.count > 0
                  return (
                    <Badge
                      key={category.name}
                      variant={hasFindings ? 'outline' : 'secondary'}
                      className="text-xs"
                    >
                      {label} · {category.count}
                    </Badge>
                  )
                })}
              </div>
            </div>

            {author.profileUrl ? (
              <a
                href={author.profileUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-fit items-center gap-2 text-sm text-accent-primary hover:underline"
                onClick={() => onVerifyAuthor?.()}
                onAuxClick={(event) => {
                  if (event.button === 1) {
                    onVerifyAuthor?.()
                  }
                }}
              >
                Открыть профиль VK
              </a>
            ) : null}
          </div>

          <div className="space-y-3 rounded-2xl border border-border/50 bg-background-primary/40 p-4">
            <p className="text-sm font-medium text-text-primary">Распределение по уровням</p>
            <div className="space-y-2">
              {summary?.levels.map((level) => (
                <div key={level.level} className="flex items-center justify-between gap-3">
                  <SuspicionLevelBadge level={level.level} />
                  <span className="text-sm text-text-secondary">{level.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </SectionCard>
  )
}

interface AuthorHeroSectionProps {
  author: AuthorDetails | null
  summary: PhotoAnalysisSummary | null
  isAnalyzing: boolean
  isValidAuthor: boolean
  onAnalyze: (force?: boolean) => void
  onDelete: () => void
}

function AuthorHeroSection({
  author,
  summary,
  isAnalyzing,
  isValidAuthor,
  onAnalyze,
  onDelete,
}: AuthorHeroSectionProps) {
  const heroFooter = useMemo(() => {
    if (!summary) {
      return null
    }

    const lastAnalyzed = formatDateTime(summary.lastAnalyzedAt)
    const verifiedAt = formatDateTime(author?.verifiedAt)
    const lastSeen = formatDateTime(author?.lastSeenAt)

    return (
      <div className="flex flex-wrap items-center gap-2">
        <Badge
          variant="outline"
          className="border-accent-primary/30 bg-accent-primary/10 text-accent-primary"
        >
          Фото: {summary.total}
        </Badge>
        <Badge
          variant="outline"
          className="border-destructive/30 bg-destructive/10 text-destructive"
        >
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
    <PageHeader
      variant="hero"
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

function AuthorAnalysisPage() {
  const { author, isAuthorLoading, vkUserId, isValidAuthor, handleVerifyAuthor } = useAuthorData()
  const {
    analyses,
    summary,
    isLoading,
    isAnalyzing,
    filter,
    handleAnalyze,
    handleDelete,
    handleFilterChange,
  } = usePhotoAnalysis(vkUserId, isValidAuthor, author)

  return (
    <div className="flex flex-col gap-8">
      <AuthorHeroSection
        author={author}
        summary={summary}
        isAnalyzing={isAnalyzing}
        isValidAuthor={isValidAuthor}
        onAnalyze={handleAnalyze}
        onDelete={handleDelete}
      />

      <AnalysisSummarySection
        author={author}
        summary={summary}
        isAuthorLoading={isAuthorLoading}
        onVerifyAuthor={handleVerifyAuthor}
      />

      <PhotosSection
        analyses={analyses}
        isLoading={isLoading}
        filter={filter}
        onFilterChange={handleFilterChange}
      />
    </div>
  )
}

export default AuthorAnalysisPage
