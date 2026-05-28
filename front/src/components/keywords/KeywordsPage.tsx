import { useState, useMemo, useEffect } from 'react'
import { PageHeader, PageContainer } from '@/components/common'
import {
  BookMarked,
  Tag,
  Hash,
  Plus,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Check,
  Pencil,
  Shapes,
  Trash2,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import FileUpload from '@/components/common/FileUpload'
import { useKeywordsViewModel } from '@/hooks/keywords/useKeywordsViewModel'
import { useTableSorting } from '@/hooks/common'
import type { Keyword } from '@/types'
import { getKeywordTableColumns } from '@/config/keywords/keywordTableColumns'
import { groupKeywordsByCategory } from '@/utils/keywords/groupKeywordsByCategory'
import type { IKeywordFormsResponse } from '@/api/keywords/keywords.api'
import { FormModal } from '@/components/common/FormModal'
import { ArrowUpDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import SearchInput from '@/components/common/SearchInput'
import { EmptyState } from '@/components/common/EmptyState'
import { LoadingState } from '@/components/common/LoadingState'

interface KeywordsFormProps {
  keywordValue: string
  categoryValue: string
  categorySuggestions: string[]
  phraseValue: string
  isRecalculating: boolean
  isRebuildingForms: boolean
  onKeywordChange: (value: string) => void
  onCategoryChange: (value: string) => void
  onPhraseChange: (value: string) => void
  onAdd: () => void
  onAddPhrase: () => void
  onRecalculate: () => void
  onRebuildForms: () => void
  onFilesSelect: (files: File[]) => void
}

export const KeywordsForm = ({
  keywordValue,
  categoryValue,
  categorySuggestions,
  phraseValue,
  isRecalculating,
  isRebuildingForms,
  onKeywordChange,
  onCategoryChange,
  onPhraseChange,
  onAdd,
  onAddPhrase,
  onRecalculate,
  onRebuildForms,
  onFilesSelect,
}: KeywordsFormProps) => {
  const isKeywordDisabled = keywordValue.trim().length === 0
  const isPhraseDisabled = phraseValue.trim().length === 0

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex w-full flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-end lg:w-auto">
          <div className="w-full sm:w-[200px]">
            <Input
              placeholder="Категория (опц.)"
              value={categoryValue}
              list="keyword-categories"
              onChange={(e) => onCategoryChange(e.target.value)}
            />
            <datalist id="keyword-categories">
              {categorySuggestions.map((value) => (
                <option key={value} value={value} />
              ))}
            </datalist>
          </div>
          <div className="flex flex-1 gap-2 sm:w-auto">
            <Input
              placeholder="Ключевое слово"
              value={keywordValue}
              onChange={(e) => onKeywordChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !isKeywordDisabled && onAdd()}
              className="flex-1 sm:w-[240px]"
            />
            <Button onClick={onAdd} disabled={isKeywordDisabled}>
              <Plus className="mr-2 size-4" />
              Добавить
            </Button>
          </div>
        </div>

        <div className="flex w-full items-center gap-3 lg:w-auto">
          <Button
            variant="secondary"
            onClick={onRebuildForms}
            disabled={isRebuildingForms}
            className="flex-1 lg:flex-none"
          >
            <RefreshCw className={`mr-2 size-4 ${isRebuildingForms ? 'animate-spin' : ''}`} />
            Обновить словоформы
          </Button>
          <Button
            variant="outline"
            onClick={onRecalculate}
            disabled={isRecalculating}
            className="flex-1 lg:flex-none"
          >
            <RefreshCw className={`mr-2 size-4 ${isRecalculating ? 'animate-spin' : ''}`} />
            Пересчитать
          </Button>
          <FileUpload
            onFilesSelect={onFilesSelect}
            buttonText="Импорт"
            className="flex-1 lg:flex-none"
          />
        </div>
      </div>

      <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-end lg:w-auto">
        <div className="flex gap-2 w-full sm:w-auto">
          <Input
            placeholder="Фраза для поиска"
            value={phraseValue}
            onChange={(e) => onPhraseChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !isPhraseDisabled && onAddPhrase()}
            className="flex-1 sm:flex-none sm:w-[320px]"
          />
          <Button onClick={onAddPhrase} disabled={isPhraseDisabled}>
            <Plus className="mr-2 size-4" />
            Добавить фразу
          </Button>
        </div>
      </div>
    </div>
  )
}

interface KeywordCardProps {
  keyword: Keyword
  categorySuggestions: string[]
  onDelete: (id: number) => void
  onManageForms: (keyword: Keyword) => void
  onUpdateCategory: (id: number, category?: string | null) => void | Promise<void>
}

export function KeywordCard({
  keyword,
  categorySuggestions,
  onDelete,
  onManageForms,
  onUpdateCategory,
}: KeywordCardProps) {
  const [isEditingCategory, setIsEditingCategory] = useState(false)
  const [draftCategory, setDraftCategory] = useState(keyword.category ?? '')

  useEffect(() => {
    if (!isEditingCategory) {
      setDraftCategory(keyword.category ?? '')
    }
  }, [isEditingCategory, keyword.category])

  const handleSaveCategory = async () => {
    await onUpdateCategory(keyword.id, draftCategory)
    setIsEditingCategory(false)
  }

  const handleCancelCategory = () => {
    setDraftCategory(keyword.category ?? '')
    setIsEditingCategory(false)
  }

  return (
    <Card className="relative flex flex-col h-full overflow-hidden hover:shadow-md transition-shadow">
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 z-10"
        onClick={() => onDelete(keyword.id)}
      >
        <Trash2 className="size-4" />
      </Button>

      <CardContent className="flex-1 p-3 pt-4 flex flex-col">
        <h3
          className="font-bold text-lg text-foreground truncate pr-8 mb-3 tracking-tight"
          title={keyword.word}
        >
          {keyword.word}
        </h3>

        <div className="space-y-2">
          {isEditingCategory ? (
            <>
              <Input
                aria-label="Категория слова"
                value={draftCategory}
                list={`keyword-card-categories-${keyword.id}`}
                onChange={(event) => setDraftCategory(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    void handleSaveCategory()
                  }
                  if (event.key === 'Escape') {
                    handleCancelCategory()
                  }
                }}
                placeholder="Категория"
                className="h-8"
              />
              <datalist id={`keyword-card-categories-${keyword.id}`}>
                {categorySuggestions.map((value) => (
                  <option key={value} value={value} />
                ))}
              </datalist>
              <div className="flex gap-2">
                <Button size="sm" className="h-8 flex-1" onClick={() => void handleSaveCategory()}>
                  <Check className="size-4" />
                  Сохранить
                </Button>
                <Button variant="outline" size="sm" className="h-8" onClick={handleCancelCategory}>
                  <X className="size-4" />
                </Button>
              </div>
            </>
          ) : keyword.category ? (
            <Badge
              variant="secondary"
              className="w-fit text-xs font-normal px-2.5 py-0.5 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/10"
            >
              {keyword.category}
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="w-fit text-xs font-normal text-muted-foreground border-muted-foreground/20 bg-transparent"
            >
              Без категории
            </Badge>
          )}
        </div>

        <div className="mt-auto pt-4">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 justify-center gap-2"
              onClick={() => setIsEditingCategory(true)}
              aria-label="Редактировать категорию"
            >
              <Pencil className="size-4" />
              Тег
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 justify-center gap-2"
              onClick={() => onManageForms(keyword)}
            >
              <Shapes className="size-4" />
              Формы
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface KeywordCategorySectionProps {
  category: string
  keywords: Keyword[]
  isExpanded: boolean
  onToggle: () => void
  onDelete: (id: number) => void | Promise<void>
  onManageForms: (keyword: Keyword) => void
  onUpdateCategory: (id: number, category?: string | null) => void | Promise<void>
  categorySuggestions: string[]
}

export function KeywordCategorySection({
  category,
  keywords,
  isExpanded,
  onToggle,
  onDelete,
  onManageForms,
  onUpdateCategory,
  categorySuggestions,
}: KeywordCategorySectionProps) {
  return (
    <section className="space-y-4 rounded-2xl border border-border/60 bg-background/20 p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-semibold tracking-tight">{category}</h3>
          <Badge
            variant="secondary"
            className="bg-background/60 px-2 py-0.5 text-xs font-normal text-muted-foreground"
          >
            {keywords.length}
          </Badge>
        </div>

        <Button variant="ghost" size="sm" className="h-8 gap-2" onClick={onToggle}>
          {isExpanded ? 'Свернуть' : 'Развернуть'}
          {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </Button>
      </div>

      {isExpanded && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {keywords.map((keyword) => (
            <KeywordCard
              key={keyword.id}
              keyword={keyword}
              onDelete={onDelete}
              onManageForms={onManageForms}
              onUpdateCategory={onUpdateCategory}
              categorySuggestions={categorySuggestions}
            />
          ))}
        </div>
      )}
    </section>
  )
}

interface SortOption {
  key: string
  label: string
  directionLabel?: { asc: string; desc: string }
}

interface KeywordsTableCardProps {
  keywords: Keyword[]
  isLoading: boolean
  onDelete: (id: number) => void | Promise<void>
  onManageForms: (keyword: Keyword) => void
  onUpdateCategory: (id: number, category?: string | null) => void | Promise<void>
  categorySuggestions: string[]
  searchTerm: string
  onSearchChange: (value: string) => void
}

export function KeywordsTableCard({
  keywords,
  isLoading,
  onDelete,
  onManageForms,
  onUpdateCategory,
  categorySuggestions,
  searchTerm,
  onSearchChange,
}: KeywordsTableCardProps) {
  const tableColumns = useMemo(() => getKeywordTableColumns(), [])

  const {
    sortedItems: sortedKeywords,
    sortState,
    requestSort,
  } = useTableSorting(keywords, tableColumns)

  const sortOptions: SortOption[] = useMemo(() => {
    return tableColumns
      .filter((col) => col.sortable)
      .map((col) => ({
        key: col.key,
        label: col.header,
        directionLabel: { asc: ' (А-Я)', desc: ' (Я-А)' },
      }))
  }, [tableColumns])

  const currentSortLabel = sortOptions.find((o) => o.key === sortState?.key)?.label || 'Сортировка'

  const hasKeywords = keywords.length > 0
  const hasFilteredKeywords = sortedKeywords.length > 0
  const groupedKeywords = useMemo(() => groupKeywordsByCategory(sortedKeywords), [sortedKeywords])
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({})

  const toggleCategory = (category: string) => {
    setExpandedCategories((current) => ({
      ...current,
      [category]: !(current[category] ?? true),
    }))
  }

  return (
    <Card className="relative overflow-hidden rounded-xl border border-border bg-background-secondary shadow-soft-sm">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-border bg-background-sidebar/30 p-4 md:flex-row md:items-center md:justify-between md:px-6">
        <div className="flex items-center gap-3">
          <h2 className="font-monitoring-display text-xl font-semibold tracking-tight text-text-light">
            Список слов
          </h2>
          {!isLoading && keywords.length > 0 && (
            <Badge className="border border-border bg-background-primary px-3 py-1 font-mono-accent text-xs text-text-secondary">
              {keywords.length}
            </Badge>
          )}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchInput
            value={searchTerm}
            onChange={onSearchChange}
            placeholder="Поиск..."
            className="h-10 w-full border-border bg-background-primary text-text-light placeholder:text-text-secondary focus:border-primary/50 focus:ring-primary/20 sm:w-[250px]"
          />

          {sortOptions.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 gap-2 border-border bg-background-primary text-text-secondary hover:border-primary/50 hover:bg-background-sidebar hover:text-text-light"
                >
                  <ArrowUpDown className="size-4" />
                  <span className="max-w-[100px] truncate">{currentSortLabel}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="border border-border bg-background-secondary shadow-soft-lg animate-in fade-in-80 duration-100"
              >
                {sortOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.key}
                    onClick={() => requestSort(option.key)}
                    className="text-text-secondary hover:bg-background-primary hover:text-text-light cursor-pointer"
                  >
                    {option.label}
                    {sortState?.key === option.key && (
                      <span className="ml-auto font-mono-accent text-xs text-primary">
                        {sortState.direction === 'asc' ? ' (А-Я)' : ' (Я-А)'}
                      </span>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Content */}
      <CardContent className="p-4 md:p-6">
        {isLoading && !hasKeywords && (
          <div className="py-8">
            <LoadingState message="Загружаем ключевые слова…" />
          </div>
        )}

        {!isLoading && !hasKeywords && (
          <EmptyState
            icon="🔑"
            title="Список пуст"
            description="Добавьте ключевые слова вручную или загрузите список из файла. Если не указать категорию, слово автоматически окажется в разделе «Без категории», и вы сможете распределить его позже."
          />
        )}

        {!isLoading && hasKeywords && !hasFilteredKeywords && (
          <div className="flex flex-col items-center justify-center py-12 text-center text-sm text-text-secondary">
            По запросу «<span className="font-mono-accent text-primary">{searchTerm}</span>» ничего не найдено
          </div>
        )}

        {hasKeywords && (hasFilteredKeywords || isLoading) && (
          <div className="space-y-4">
            {groupedKeywords.map((group) => (
              <KeywordCategorySection
                key={group.category}
                category={group.category}
                keywords={group.keywords}
                isExpanded={expandedCategories[group.category] ?? true}
                onToggle={() => toggleCategory(group.category)}
                onDelete={onDelete}
                onManageForms={onManageForms}
                onUpdateCategory={onUpdateCategory}
                categorySuggestions={categorySuggestions}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface KeywordFormsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  keyword: Keyword | null
  forms: IKeywordFormsResponse | null
  isLoading: boolean
  manualFormValue: string
  exclusionValue: string
  onManualFormChange: (value: string) => void
  onExclusionChange: (value: string) => void
  onAddManualForm: () => void | Promise<void>
  onRemoveManualForm: (form: string) => void | Promise<void>
  onAddExclusion: () => void | Promise<void>
  onRemoveExclusion: (form: string) => void | Promise<void>
}

function renderFormBadges(
  forms: string[],
  emptyLabel: string,
  onRemove?: (form: string) => void | Promise<void>
) {
  if (forms.length === 0) {
    return <div className="text-xs text-text-secondary font-monitoring-body">{emptyLabel}</div>
  }

  return (
    <div className="flex flex-wrap gap-2">
      {forms.map((form) => (
        <div
          key={form}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-background-primary px-3 py-1 text-xs text-text-light font-monitoring-body"
        >
          <span>{form}</span>
          {onRemove ? (
            <button
              type="button"
              className="text-text-secondary transition hover:text-destructive text-[10px] font-bold uppercase font-mono-accent cursor-pointer"
              onClick={() => onRemove(form)}
            >
              удалить
            </button>
          ) : null}
        </div>
      ))}
    </div>
  )
}

export function KeywordFormsSheet({
  open,
  onOpenChange,
  keyword,
  forms,
  isLoading,
  manualFormValue,
  exclusionValue,
  onManualFormChange,
  onExclusionChange,
  onAddManualForm,
  onRemoveManualForm,
  onAddExclusion,
  onRemoveExclusion,
}: KeywordFormsSheetProps) {
  const isPhrase = keyword?.isPhrase === true

  return (
    <FormModal
      isOpen={open}
      onClose={() => onOpenChange(false)}
      title={
        <div className="flex items-center gap-2">
          <span>{keyword?.word ?? 'Формы ключевого слова'}</span>
          {keyword ? (
            <Badge
              variant={isPhrase ? 'outline' : 'secondary'}
              className="h-5 px-2 text-[10px] uppercase font-mono-accent"
            >
              {isPhrase ? 'Фраза' : 'Слово'}
            </Badge>
          ) : null}
        </div>
      }
      description="Управление словоформами и исключениями для точного контроля keyword matching."
      icon={<Tag className="h-5 w-5" />}
      isSaving={isLoading}
      widthClass="max-w-2xl"
    >
      {!keyword ? null : (
        <div className="flex flex-col gap-4 pt-2">
          <Card className="border-border bg-background-primary/20">
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-text-light font-mono-accent">
                Автосгенерированные формы
              </CardTitle>
              <CardDescription className="text-xs text-text-secondary font-monitoring-body">
                Эти формы собираются backend-ом и участвуют в матчинге автоматически.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {isLoading ? (
                <span className="text-xs text-text-secondary font-mono-accent">Загрузка…</span>
              ) : (
                renderFormBadges(forms?.generatedForms ?? [], 'Нет автосгенерированных форм')
              )}
            </CardContent>
          </Card>

          <Card className="border-border bg-background-primary/20">
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-text-light font-mono-accent">
                Ручные формы
              </CardTitle>
              <CardDescription className="text-xs text-text-secondary font-monitoring-body">
                Добавляйте нестандартные варианты, которые не покрывает морфология.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-4 pb-4">
              {isPhrase ? (
                <div className="rounded-lg border border-warning-amber/20 bg-warning-amber/5 px-3 py-2 text-xs text-warning-amber font-monitoring-body">
                  Для фраз ручные формы отключены. Используйте только исходную фразу.
                </div>
              ) : (
                <>
                  <div className="flex gap-2">
                    <Input
                      value={manualFormValue}
                      onChange={(event) => onManualFormChange(event.target.value)}
                      placeholder="Например: ауешница"
                      className="h-10 border-border bg-background-primary text-text-light placeholder:text-text-secondary focus:border-accent-primary/50 focus:ring-accent-primary/20"
                    />
                    <Button
                      onClick={() => void onAddManualForm()}
                      disabled={!manualFormValue.trim()}
                      className="h-10 bg-accent-primary text-text-light hover:bg-accent-primary/95 transition-all"
                    >
                      Добавить
                    </Button>
                  </div>
                  {isLoading ? (
                    <span className="text-xs text-text-secondary font-mono-accent">Загрузка…</span>
                  ) : (
                    renderFormBadges(
                      forms?.manualForms ?? [],
                      'Ручные формы пока не добавлены',
                      onRemoveManualForm
                    )
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-border bg-background-primary/20">
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-text-light font-mono-accent">
                Исключения
              </CardTitle>
              <CardDescription className="text-xs text-text-secondary font-monitoring-body">
                Исключённые формы не будут возвращаться после регенерации generated-форм.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-4 pb-4">
              {isPhrase ? (
                <div className="rounded-lg border border-warning-amber/20 bg-warning-amber/5 px-3 py-2 text-xs text-warning-amber font-monitoring-body">
                  Для фраз exclusions не применяются.
                </div>
              ) : (
                <>
                  <div className="flex gap-2">
                    <Input
                      value={exclusionValue}
                      onChange={(event) => onExclusionChange(event.target.value)}
                      placeholder="Например: клоуном"
                      className="h-10 border-border bg-background-primary text-text-light placeholder:text-text-secondary focus:border-accent-primary/50 focus:ring-accent-primary/20"
                    />
                    <Button
                      onClick={() => void onAddExclusion()}
                      disabled={!exclusionValue.trim()}
                      className="h-10 bg-accent-primary text-text-light hover:bg-accent-primary/95 transition-all"
                    >
                      Исключить
                    </Button>
                  </div>
                  {isLoading ? (
                    <span className="text-xs text-text-secondary font-mono-accent">Загрузка…</span>
                  ) : (
                    renderFormBadges(
                      forms?.exclusions ?? [],
                      'Исключения пока не заданы',
                      onRemoveExclusion
                    )
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </FormModal>
  )
}

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

  const pageCards = [
    {
      icon: BookMarked,
      title: 'Автопоиск',
      subtitle: 'Автоматическое выделение ключевых слов в комментариях',
    },
    {
      icon: Tag,
      title: 'Категории',
      subtitle: 'Группируйте слова по темам для удобной навигации',
    },
    {
      icon: Hash,
      title: 'Импорт',
      subtitle: 'Массовая загрузка ключевых слов из файла',
    },
  ]

  return (
    <PageContainer maxWidth="1600px" animate={false}>
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
                <span className="font-mono-accent font-semibold text-text-light">
                  {keywords.length}
                </span>
              </span>
            </div>
          }
          cards={pageCards}
        />
      </div>

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
    </PageContainer>
  )
}

export default KeywordsPage
