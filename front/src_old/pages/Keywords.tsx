import KeywordsTableCard from '@/features/keywords/ui/KeywordsTableCard'
import { KeywordsHero } from '@/features/keywords/ui/KeywordsHero'
import { KeywordsForm } from '@/features/keywords/ui/KeywordsForm'
import { useKeywordsViewModel } from '@/features/keywords/model/useKeywordsViewModel'

function Keywords() {
  const {
    keywords,
    isLoading,
    searchTerm,
    keywordValue,
    categoryValue,
    phraseValue,
    isRecalculating,
    setKeywordValue,
    setCategoryValue,
    setPhraseValue,
    setSearchTerm,
    handleAddKeyword,
    handleAddPhrase,
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
        phraseValue={phraseValue}
        isRecalculating={isRecalculating}
        onKeywordChange={setKeywordValue}
        onCategoryChange={setCategoryValue}
        onPhraseChange={setPhraseValue}
        onAdd={handleAddKeyword}
        onAddPhrase={handleAddPhrase}
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
