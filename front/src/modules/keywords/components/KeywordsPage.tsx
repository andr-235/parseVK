import KeywordsTableCard from '@/modules/keywords/components/KeywordsTableCard'
import { KeywordFormsSheet } from '@/modules/keywords/components/KeywordFormsSheet'
import { KeywordsHero } from '@/modules/keywords/components/KeywordsHero'
import { KeywordsForm } from '@/modules/keywords/components/KeywordsForm'
import { useKeywordsViewModel } from '@/modules/keywords/hooks/useKeywordsViewModel'

function KeywordsPage() {
  const {
    keywords,
    isLoading,
    searchTerm,
    keywordValue,
    categoryValue,
    categorySuggestions,
    phraseValue,
    isRecalculating,
    isRebuildingForms,
    selectedKeyword,
    keywordForms,
    isKeywordFormsLoading,
    manualFormValue,
    exclusionValue,
    setKeywordValue,
    setCategoryValue,
    setPhraseValue,
    setSearchTerm,
    setManualFormValue,
    setExclusionValue,
    handleAddKeyword,
    handleAddPhrase,
    handleUpdateKeywordCategory,
    handleFileUpload,
    handleRecalculate,
    handleRebuildForms,
    handleManageForms,
    handleKeywordFormsOpenChange,
    handleAddManualForm,
    handleRemoveManualForm,
    handleAddExclusion,
    handleRemoveExclusion,
    deleteKeyword,
  } = useKeywordsViewModel()

  return (
    <div className="flex flex-col gap-10 max-w-[1600px] mx-auto w-full px-4 md:px-8 py-6 font-monitoring-body">
      {/* Hero Section - fade in first */}
      <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
        <KeywordsHero totalKeywords={keywords.length} />
      </div>

      {/* Keywords Form - staggered animation */}
      <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-100">
        <div className="flex items-center gap-4">
          <h2 className="font-monitoring-display text-2xl font-semibold text-white">
            Добавить ключевые слова
          </h2>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
        </div>

        <KeywordsForm
          keywordValue={keywordValue}
          categoryValue={categoryValue}
          categorySuggestions={categorySuggestions}
          phraseValue={phraseValue}
          isRecalculating={isRecalculating}
          isRebuildingForms={isRebuildingForms}
          onKeywordChange={setKeywordValue}
          onCategoryChange={setCategoryValue}
          onPhraseChange={setPhraseValue}
          onAdd={handleAddKeyword}
          onAddPhrase={handleAddPhrase}
          onRecalculate={handleRecalculate}
          onRebuildForms={handleRebuildForms}
          onFileUpload={handleFileUpload}
        />
      </div>

      {/* Keywords Table - staggered animation */}
      <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-200">
        <div className="flex items-center gap-4">
          <h2 className="font-monitoring-display text-2xl font-semibold text-white">
            Словарь ключевых слов
          </h2>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
        </div>

        <KeywordsTableCard
          keywords={keywords}
          isLoading={isLoading}
          onDelete={deleteKeyword}
          onManageForms={handleManageForms}
          onUpdateCategory={handleUpdateKeywordCategory}
          categorySuggestions={categorySuggestions}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />
      </div>

      <KeywordFormsSheet
        open={selectedKeyword !== null}
        onOpenChange={handleKeywordFormsOpenChange}
        keyword={selectedKeyword}
        forms={keywordForms}
        isLoading={isKeywordFormsLoading}
        manualFormValue={manualFormValue}
        exclusionValue={exclusionValue}
        onManualFormChange={setManualFormValue}
        onExclusionChange={setExclusionValue}
        onAddManualForm={handleAddManualForm}
        onRemoveManualForm={handleRemoveManualForm}
        onAddExclusion={handleAddExclusion}
        onRemoveExclusion={handleRemoveExclusion}
      />
    </div>
  )
}

export default KeywordsPage
