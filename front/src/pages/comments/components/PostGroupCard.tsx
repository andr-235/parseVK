import { memo, useMemo } from 'react'
import type { Comment, Keyword } from '@/shared/types'
import { KeywordBadge } from './KeywordBadge'
import { normalizeForKeywordMatch } from '@/shared/utils/keywordMatching'

interface PostGroupCardProps {
  postText?: string | null
  postAttachments?: unknown | null
  postGroup?: {
    name: string
    photo: string | null
  } | null
  comments: Array<{
    comment: Comment
    matchedKeywords: Keyword[]
    index: number
  }>
}

export const PostGroupCard = memo(function PostGroupCard({
  postText,
  postGroup,
  comments,
}: PostGroupCardProps) {
  const postKeywords = useMemo(() => {
    if (!postText) return []

    const seen = new Map<number, Keyword>()
    for (const c of comments) {
      for (const kw of c.matchedKeywords) {
        if (!seen.has(kw.id)) {
          seen.set(kw.id, kw)
        }
      }
    }

    return Array.from(seen.values()).filter((kw) => {
      if (kw.source !== 'POST') return false
      const normalizedText = normalizeForKeywordMatch(postText)
      const candidateForms = Array.isArray(kw.forms) && kw.forms.length > 0 ? kw.forms : [kw.word]
      return candidateForms.some((form) => {
        const normalizedKeyword = normalizeForKeywordMatch(form)
        return normalizedKeyword.length > 0 && normalizedText.includes(normalizedKeyword)
      })
    })
  }, [comments, postText])

  if (!postText && !postGroup) return null

  return (
    <div className="flex items-center gap-2 border-b border-border/40 bg-accent-info/[0.02] px-4 py-1.5">
      {postGroup?.photo && (
        <img
          src={postGroup.photo}
          alt=""
          className="size-4 shrink-0 rounded-full"
          loading="lazy"
        />
      )}
      <span className="truncate text-xs text-text-secondary/70">
        {postGroup?.name && (
          <span className="font-medium text-text-secondary/80">{postGroup.name}</span>
        )}
        {postText && (
          <>
            {postGroup?.name && <span className="mx-1.5 text-text-secondary/30">·</span>}
            <span>{postText.slice(0, 80)}{postText.length > 80 ? '…' : ''}</span>
          </>
        )}
      </span>
      <div className="ml-auto flex shrink-0 items-center gap-2">
        {postKeywords.length > 0 && (
          <div className="flex gap-1.5">
            {postKeywords.map((kw) => (
              <KeywordBadge key={kw.id} keyword={kw} text={postText} />
            ))}
          </div>
        )}
        <span className="font-mono-accent text-[10px] text-text-secondary/40">{comments.length}</span>
      </div>
    </div>
  )
})
