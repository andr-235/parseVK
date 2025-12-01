import KeywordsTableCard from './Keywords/components/KeywordsTableCard'
import { KeywordsHero } from './Keywords/components/KeywordsHero'
import { KeywordsForm } from './Keywords/components/KeywordsForm'
import { useKeywordsViewModel } from './Keywords/hooks/useKeywordsViewModel'

function Keywords() {
  const {
    keywords,
    isLoading,
    searchTerm,
    keywordValue,
    categoryValue,
    isRecalculating,
    setKeywordValue,
    setCategoryValue,
    setSearchTerm,
    handleAddKeyword,
    handleFileUpload,
    handleRecalculate,
    deleteKeyword,
  } = useKeywordsViewModel()

  return (
    <div className="flex flex-col gap-8 pb-10 pt-6">
      <KeywordsHero />

      <KeywordsForm
        keywordValue={keywordValue}
        categoryValue={categoryValue}
        isRecalculating={isRecalculating}
        onKeywordChange={setKeywordValue}
        onCategoryChange={setCategoryValue}
        onAdd={handleAddKeyword}
        onRecalculate={handleRecalculate}
        onFileUpload={handleFileUpload}
      />

      <KeywordsTableCard
        keywords={keywords}
        isLoading={isLoading}
        onDelete={deleteKeyword}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />
    </div>
  )
}

export default Keywords
