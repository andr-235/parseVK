import { Button } from '@/components/ui/button'
import SectionCard from '@/components/SectionCard'
import { Spinner } from '@/components/ui/spinner'
import { PhotoAnalysisCard } from '@/components/PhotoAnalysisCard'
import type { PhotoAnalysis } from '@/types'

interface PhotosSectionProps {
  analyses: PhotoAnalysis[]
  isLoading: boolean
  filter: 'all' | 'suspicious'
  onFilterChange: (filter: 'all' | 'suspicious') => void
}

/**
 * Компонент секции фотографий
 * Отображает результаты анализа фотографий с фильтрами
 */
export const PhotosSection = ({
  analyses,
  isLoading,
  filter,
  onFilterChange,
}: PhotosSectionProps) => {
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
            {filter === 'suspicious' ? 'Подозрительные фото не найдены' : 'Результаты анализа отсутствуют'}
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