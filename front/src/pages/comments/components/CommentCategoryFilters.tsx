import { memo } from 'react'
import { cn } from '@/shared/utils'

interface CommentCategoryFiltersProps {
  categories: string[]
  activeCategory: string | null
  onSelectCategory: (category: string | null) => void
}

export const CommentCategoryFilters = memo(function CommentCategoryFilters({
  categories,
  activeCategory,
  onSelectCategory,
}: CommentCategoryFiltersProps) {
  if (categories.length === 0) {
    return null
  }

  return (
    <div className="flex items-center gap-1.5 border-b border-border/40 pb-2" role="tablist" aria-label="Категории комментариев">
      <button
        type="button"
        role="tab"
        aria-selected={activeCategory === null}
        onClick={() => onSelectCategory(null)}
        className={cn(
          'rounded-md px-3 py-1.5 font-mono-accent text-xs font-medium transition-all duration-200',
          activeCategory === null
            ? 'bg-accent-primary/10 text-accent-primary shadow-sm'
            : 'text-text-secondary hover:bg-background-primary/30 hover:text-text-light'
        )}
      >
        Все
        {activeCategory === null && categories.length > 0 && (
          <span className="ml-1.5 font-mono-accent text-[10px] text-accent-primary/70">
            ({categories.length})
          </span>
        )}
      </button>
      {categories.map((category) => (
        <button
          key={category}
          type="button"
          role="tab"
          aria-selected={activeCategory === category}
          onClick={() => onSelectCategory(category)}
          className={cn(
            'rounded-md px-3 py-1.5 font-mono-accent text-xs font-medium transition-all duration-200',
            activeCategory === category
              ? 'bg-accent-info/10 text-accent-info shadow-sm'
              : 'text-text-secondary hover:bg-background-primary/30 hover:text-text-light'
          )}
        >
          {category}
        </button>
      ))}
    </div>
  )
})
