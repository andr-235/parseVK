import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { Keyword } from '@/types'
import LoadingKeywordsState from './LoadingKeywordsState'
import EmptyKeywordsState from './EmptyKeywordsState'
import KeywordChip from '@/components/KeywordChip'

interface KeywordsCategoriesCardProps {
  keywords: Keyword[]
  isLoading: boolean
  onDelete: (id: number) => Promise<void> | void
}

interface CategoryGroup {
  name: string
  keywords: Keyword[]
}

const DEFAULT_CATEGORY = 'Без категории'

const getWordLabel = (count: number) => {
  const remainder10 = count % 10
  const remainder100 = count % 100

  if (remainder10 === 1 && remainder100 !== 11) {
    return 'слово'
  }

  if (remainder10 >= 2 && remainder10 <= 4 && (remainder100 < 12 || remainder100 > 14)) {
    return 'слова'
  }

  return 'слов'
}

const getCategoryLabel = (count: number) => {
  const remainder10 = count % 10
  const remainder100 = count % 100

  if (remainder10 === 1 && remainder100 !== 11) {
    return 'категория'
  }

  if (remainder10 >= 2 && remainder10 <= 4 && (remainder100 < 12 || remainder100 > 14)) {
    return 'категории'
  }

  return 'категорий'
}

function KeywordsCategoriesCard({ keywords, isLoading, onDelete }: KeywordsCategoriesCardProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const [showAllInExpanded, setShowAllInExpanded] = useState(false)
  const INITIAL_VISIBLE = 30

  const groupedKeywords = useMemo<CategoryGroup[]>(() => {
    const groups = new Map<string, Keyword[]>()

    keywords.forEach((keyword) => {
      const rawCategory = keyword.category?.trim()
      const categoryName = rawCategory && rawCategory.length > 0 ? rawCategory : DEFAULT_CATEGORY
      const items = groups.get(categoryName) ?? []
      items.push(keyword)
      groups.set(categoryName, items)
    })

    return Array.from(groups.entries())
      .map(([name, items]) => ({
        name,
        keywords: items
          .slice()
          .sort((a, b) => a.word.localeCompare(b.word, 'ru', { sensitivity: 'base' })),
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'ru', { sensitivity: 'base' }))
  }, [keywords])

  useEffect(() => {
    // Если набор категорий изменился и текущая категория исчезла — сбрасываем выбор
    if (groupedKeywords.length === 0 || !groupedKeywords.some((g) => g.name === expandedCategory)) {
      setExpandedCategory(null)
      setShowAllInExpanded(false)
    }
  }, [groupedKeywords, expandedCategory])

  const hasKeywords = keywords.length > 0
  const totalCategories = groupedKeywords.length
  const totalKeywords = keywords.length

  const subtitle = useMemo(() => {
    if (isLoading && !hasKeywords) {
      return 'Мы подготавливаем данные и проверяем их перед отображением.'
    }

    if (hasKeywords) {
      return 'Категории формируются автоматически. Слова без категории попадают в раздел «Без категории».'
    }

    return 'Добавьте первое ключевое слово — категорию можно задать сразу или позже.'
  }, [hasKeywords, isLoading])

  const toggleCategory = (name: string) => {
    setExpandedCategory((current) => (current === name ? null : name))
    setShowAllInExpanded(false)
  }

  const handleDelete = async (id: number) => {
    try {
      await onDelete(id)
    } catch (error) {
      console.error('Failed to delete keyword', error)
    }
  }

  return (
    <Card className="bg-transparent border-none shadow-none" aria-label="Категории ключевых слов">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4 space-y-0 px-0 pt-0 pb-2">
        <div className="flex min-w-[260px] flex-1 flex-col gap-2">
          <CardTitle className="text-2xl font-bold text-text-primary">Категории ключевых слов</CardTitle>
          <CardDescription className="max-w-[640px] text-[15px] leading-relaxed text-text-secondary">{subtitle}</CardDescription>
        </div>
        <div className="flex min-w-[220px] flex-col items-end gap-3">
          {isLoading ? (
            <Badge variant="secondary" className="bg-[rgba(241,196,15,0.18)] text-[#f1c40f] dark:text-[#f9e79f]">
              Загрузка…
            </Badge>
          ) : (
            <div className="flex flex-col items-end gap-2">
              <Badge variant="secondary" className="bg-[rgba(52,152,219,0.12)] text-[#3498db] dark:text-[#5dade2]">
                {totalKeywords} {getWordLabel(totalKeywords)}
              </Badge>
              <Badge variant="outline" className="border-dashed border-border/60 text-text-secondary">
                {totalCategories} {getCategoryLabel(totalCategories)}
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="px-0 pb-0 pt-0">
        {isLoading && !hasKeywords && <LoadingKeywordsState />}

        {!isLoading && !hasKeywords && <EmptyKeywordsState />}

        {hasKeywords && (
          <div className="flex flex-col gap-3">
            {/* Подсказка удалена для компактности */}
            {groupedKeywords.map((group) => {
              const isExpanded = expandedCategory === group.name

              return (
                <motion.div
                  key={group.name}
                  className={cn(
                    'rounded-xl border border-border/40 bg-background/30 p-4 transition-colors',
                    isExpanded ? 'border-primary/60' : 'hover:border-primary/50'
                  )}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.3 }}
                >
                  <button
                    type="button"
                    onClick={() => toggleCategory(group.name)}
                    className="flex w-full items-center justify-between gap-4 text-left"
                    aria-expanded={isExpanded}
                  >
                    <div className="flex flex-col gap-1">
                      <span className="text-lg font-semibold text-text-primary">{group.name}</span>
                      <span className="text-sm text-text-secondary">
                        {group.keywords.length} {getWordLabel(group.keywords.length)}
                      </span>
                    </div>
                    <span className="text-text-secondary">
                      {isExpanded ? <ChevronUp className="size-5" aria-hidden /> : <ChevronDown className="size-5" aria-hidden />}
                    </span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        key="expanded"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="mt-3"
                      >
                      <motion.ul layout className="flex flex-wrap gap-2.5">
                        <AnimatePresence initial={false}>
                          {(showAllInExpanded ? group.keywords : group.keywords.slice(0, INITIAL_VISIBLE)).map((keyword) => (
                            <KeywordChip key={keyword.id} id={keyword.id} text={keyword.word} onRemove={handleDelete} />
                          ))}
                        </AnimatePresence>
                      </motion.ul>
                      {group.keywords.length > INITIAL_VISIBLE && (
                        <div className="mt-4">
                          <button
                            type="button"
                            onClick={() => setShowAllInExpanded((v) => !v)}
                            className="text-sm text-accent-primary hover:underline"
                          >
                            {showAllInExpanded
                              ? 'Свернуть'
                              : `Показать все ${group.keywords.length} ${getWordLabel(group.keywords.length)}`}
                          </button>
                        </div>
                      )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default KeywordsCategoriesCard
