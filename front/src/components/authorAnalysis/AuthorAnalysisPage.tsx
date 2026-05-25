import { useAuthorData } from '@/hooks/authors/useAuthorData';
import { usePhotoAnalysis } from '@/hooks/authorAnalysis/usePhotoAnalysis'
import { AuthorHeroSection } from '@/components/authorAnalysis/AuthorHeroSection'
import { AnalysisSummarySection } from '@/components/authorAnalysis/AnalysisSummarySection'
import { PhotosSection } from '@/components/authorAnalysis/PhotosSection'

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
