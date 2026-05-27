import KeywordsTableCard from '@/components/keywords/KeywordsTableCard'
import { KeywordFormsSheet } from '@/components/keywords/KeywordFormsSheet'
import { PageHeader } from '@/components/common'
import { BookMarked, Tag, Hash } from 'lucide-react'
import { KeywordsForm } from '@/components/keywords/KeywordsForm'
import { useKeywordsViewModel } from '@/hooks/keywords/useKeywordsViewModel'

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
    handleFilesSelect,
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
      <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
        <PageHeader
          variant="grid"
          title={
            <>
              Ключевые <span className="text-accent-primary">слова</span>
            </>
          }
          description="Управляйте словарем для автоматического поиска совпадений в комментариях. Группируйте слова по категориям для более точной фильтрации."
          colsClass="grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          actions={
            <div className="flex items-center gap-2 shrink-0">
              <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background-secondary px-4 py-2 text-sm shadow-soft-sm">
                <Hash className="w-4 h-4 text-accent-primary" />
                <span className="text-text-secondary">Всего слов:</span>
                <span className="font-mono-accent font-semibold text-text-light">{keywords.length}</span>
              </span>
            </div>
          }
          cards={[
            {
              icon: BookMarked,
              title: 'Автопоиск',
              subtitle: 'Автоматическое выделение ключевых слов в комментариях',
            },
            {
              icon: Tag,
              title: 'Категории',
              subtitle: 'Группируйте слова по темам для удобной навигации',
              bgGradientClass: 'from-orange-500/20 to-accent-primary/20',
              borderGradientClass: 'via-orange-500/50',
              iconBgClass: 'bg-orange-500/10',
              iconTextClass: 'text-orange-400',
            },
            {
              icon: Hash,
              title: 'Импорт',
              subtitle: 'Массовая загрузка ключевых слов из файла',
              bgGradientClass: 'from-purple-500/20 to-accent-primary/20',
              borderGradientClass: 'via-purple-500/50',
              iconBgClass: 'bg-purple-500/10',
              iconTextClass: 'text-purple-400',
            },
          ]}
        />
      </div>

      {/* Keywords Form - staggered animation */}
      <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-100">
        <div className="flex items-center gap-4">
          <h2 className="font-monitoring-display text-2xl font-semibold text-white">
            Добавить ключевые слова
          </h2>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
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
          onFilesSelect={handleFilesSelect}
        />
      </div>

      {/* Keywords Table - staggered animation */}
      <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-200">
        <div className="flex items-center gap-4">
          <h2 className="font-monitoring-display text-2xl font-semibold text-white">
            Словарь ключевых слов
          </h2>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
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
