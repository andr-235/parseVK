import { describe, expect, it } from 'vitest'
import { resolveCommentKeywords } from '../resolveCommentKeywords'

describe('resolveCommentKeywords', () => {
  it('uses keyword forms to resolve comment and post matches', () => {
    const matchedKeywords = [
      {
        id: 1,
        word: 'клоун',
        forms: ['клоун', 'клоунов'],
        source: 'COMMENT' as const,
      },
      {
        id: 2,
        word: 'ауешник',
        forms: ['ауешник', 'ауешников'],
        source: 'POST' as const,
      },
    ]

    const result = resolveCommentKeywords({
      matchedKeywords,
      commentText: 'Вижу клоунов в тексте',
      postText: 'В посте обсуждают ауешников',
    })

    expect(result.fromComment).toEqual([matchedKeywords[0]])
    expect(result.fromPost).toEqual([matchedKeywords[1]])
  })
})
