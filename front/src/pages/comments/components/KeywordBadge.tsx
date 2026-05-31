import { memo } from 'react'
import { getMatchedKeywordLabel } from '@/pages/comments/utils/getMatchedKeywordLabel'
import type { Keyword } from '@/shared/types'

interface KeywordBadgeProps {
  keyword: Keyword
  text?: string | null
}

export const KeywordBadge = memo(function KeywordBadge({ keyword, text }: KeywordBadgeProps) {
  return (
    <span className="font-mono-accent text-[10px] text-accent-warning/70">
      {getMatchedKeywordLabel(keyword, text ?? '')}
    </span>
  )
})
