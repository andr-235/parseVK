import { useAuthorData } from '@/hooks/useAuthorData'
import { usePhotoAnalysis } from '@/hooks/usePhotoAnalysis'
import { AuthorHeroSection } from '@/components/AuthorHeroSection'
import { AnalysisSummarySection } from '@/components/AnalysisSummarySection'
import { PhotosSection } from '@/components/PhotosSection'

/**
 * Компонент страницы анализа автора
 * Рефакторинг: разделен на меньшие компоненты и кастомные хуки для лучшей читаемости и поддерживаемости
 */
function AuthorAnalysis() {
  // Используем кастомный хук для управления данными автора
  const { author, isAuthorLoading, vkUserId, isValidAuthor } = useAuthorData()

  // Используем кастомный хук для управления анализом фотографий
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

export default AuthorAnalysis
