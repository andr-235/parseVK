import { describe, expect, it } from 'vitest'
import { getMatchedKeywordLabel } from '../getMatchedKeywordLabel'

describe('getMatchedKeywordLabel', () => {
  it('returns matched form when it differs from base word', () => {
    expect(
      getMatchedKeywordLabel(
        {
          id: 1,
          word: 'клоун',
          forms: ['клоун', 'клоунов'],
        },
        'В тексте есть клоунов'
      )
    ).toBe('клоун / клоунов')
  })

  it('returns base word when matching form equals base word', () => {
    expect(
      getMatchedKeywordLabel(
        {
          id: 2,
          word: 'ремонт',
          forms: ['ремонт'],
        },
        'Нужен ремонт'
      )
    ).toBe('ремонт')
  })
})
