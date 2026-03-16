import { ChevronDown, ChevronUp } from 'lucide-react'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { KeywordCard } from './KeywordCard'
import type { Keyword } from '@/types'

interface KeywordCategorySectionProps {
  category: string
  keywords: Keyword[]
  isExpanded: boolean
  onToggle: () => void
  onDelete: (id: number) => void | Promise<void>
  onManageForms: (keyword: Keyword) => void
}

export function KeywordCategorySection({
  category,
  keywords,
  isExpanded,
  onToggle,
  onDelete,
  onManageForms,
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
            />
          ))}
        </div>
      )}
    </section>
  )
}
