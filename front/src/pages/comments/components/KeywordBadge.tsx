import { memo } from 'react'
import { Badge } from '@/shared/components/ui/badge'
import { getMatchedKeywordLabel } from '@/pages/comments/utils/getMatchedKeywordLabel'
import type { Keyword } from '@/shared/types'

interface KeywordBadgeProps {
  keyword: Keyword
  text?: string | null
}

export const KeywordBadge = memo(function KeywordBadge({ keyword, text }: KeywordBadgeProps) {
  return (
    <Badge className="h-5 border-0 bg-accent-warning/10 px-1.5 font-mono-accent text-[9px] text-accent-warning">
      {getMatchedKeywordLabel(keyword, text ?? '')}
    </Badge>
  )
})
