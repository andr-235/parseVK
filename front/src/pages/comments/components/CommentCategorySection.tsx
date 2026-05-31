import { memo } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/shared/utils'

interface CommentCategorySectionProps {
  category: string
  count: number
  isExpanded: boolean
  onToggle: () => void
  children: React.ReactNode
}

export const CommentCategorySection = memo(function CommentCategorySection({
  category,
  count,
  isExpanded,
  onToggle,
  children,
}: CommentCategorySectionProps) {
  return (
    <div>
      <div
        className={cn(
          'group/header flex cursor-pointer items-center justify-between border-b border-border/40 px-4 py-2 transition-colors duration-150 hover:bg-background-secondary/40',
          !isExpanded && 'border-b-0'
        )}
        onClick={onToggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onToggle()
          }
        }}
        aria-label={`${isExpanded ? 'Свернуть' : 'Развернуть'} категорию ${category}`}
      >
        <h3 className="flex items-center gap-2 font-mono-accent text-xs font-bold uppercase tracking-wider text-text-secondary">
          <span className="inline-block size-1.5 rounded-full bg-accent-info/50" />
          {category}
          <span className="font-mono-accent text-[10px] text-text-secondary/40">{count}</span>
        </h3>
        <ChevronDown
          className={cn(
            'size-3.5 text-text-secondary/50 transition-[transform,color] duration-200 ease-out group-hover/header:text-text-secondary',
            isExpanded && 'rotate-180'
          )}
        />
      </div>

      <div
        className={cn(
          'grid transition-[grid-template-rows] duration-200 ease-out',
          isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div className={cn('divide-y divide-border/30', isExpanded && 'animate-expand')}>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
})
