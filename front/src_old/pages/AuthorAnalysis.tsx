import { useAuthorData } from '@/features/authors/model/useAuthorData'
import { usePhotoAnalysis } from '@/features/authorAnalysis/model/usePhotoAnalysis'
import { AuthorHeroSection } from '@/features/authorAnalysis/ui/AuthorHeroSection'
import { AnalysisSummarySection } from '@/features/authorAnalysis/ui/AnalysisSummarySection'
import { PhotosSection } from '@/features/authorAnalysis/ui/PhotosSection'

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

      <AnalysisSummarySection author={author} summary={summary} isAuthorLoading={isAuthorLoading} />

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
