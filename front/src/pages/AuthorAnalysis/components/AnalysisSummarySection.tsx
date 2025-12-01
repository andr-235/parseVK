import { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import SectionCard from '@/components/SectionCard'
import { SuspicionLevelBadge } from './SuspicionLevelBadge'
import type { AuthorDetails, PhotoAnalysisSummary } from '@/types'
import { categoryLabels } from '@/utils/authorAnalysisUtils'

interface AnalysisSummarySectionProps {
  author: AuthorDetails | null
  summary: PhotoAnalysisSummary | null
  isAuthorLoading: boolean
}

/**
 * Компонент секции сводки анализа
 * Отображает категории и уровни подозрительного контента
 */
export const AnalysisSummarySection = ({
  author,
  summary,
  isAuthorLoading,
}: AnalysisSummarySectionProps) => {
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