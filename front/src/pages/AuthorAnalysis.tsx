import { useAuthorData } from '@/modules/authors/hooks/useAuthorData'
import { usePhotoAnalysis } from '@/modules/authorAnalysis/hooks/usePhotoAnalysis'
import { AuthorHeroSection } from '@/modules/authorAnalysis/components/AuthorHeroSection'
import { AnalysisSummarySection } from '@/modules/authorAnalysis/components/AnalysisSummarySection'
import { PhotosSection } from '@/modules/authorAnalysis/components/PhotosSection'

function AuthorAnalysis() {
  const { author, isAuthorLoading, vkUserId, isValidAuthor } = useAuthorData()
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
