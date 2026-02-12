import { Engine, Gender, Case } from 'russian-nouns-js'
import { normalizeForKeywordMatch } from '@/shared/utils/keywordMatching'

const rne = new Engine()

export function generateAllWordForms(keyword: string): string[] {
  const trimmed = keyword.trim()
  if (!trimmed) {
    return []
  }

  const normalized = normalizeForKeywordMatch(trimmed)
  if (!normalized) {
    return []
  }

  const allForms = new Set<string>()
  allForms.add(normalized)

  const genders = [Gender.MASCULINE, Gender.FEMININE, Gender.NEUTER]
  const cases = [
    Case.NOMINATIVE,
    Case.GENITIVE,
    Case.DATIVE,
    Case.ACCUSATIVE,
    Case.INSTRUMENTAL,
    Case.PREPOSITIONAL,
  ]

  for (const gender of genders) {
    try {
      const word = { text: normalized, gender }

      for (const grammaticalCase of cases) {
        try {
          const declinedForm = rne.decline(word, grammaticalCase)
          if (declinedForm && typeof declinedForm === 'string') {
            const normalizedForm = normalizeForKeywordMatch(declinedForm)
            if (normalizedForm) {
              allForms.add(normalizedForm)
            }
          } else if (Array.isArray(declinedForm)) {
            for (const form of declinedForm) {
              if (typeof form === 'string' && form) {
                const normalizedForm = normalizeForKeywordMatch(form)
                if (normalizedForm) {
                  allForms.add(normalizedForm)
                }
              }
            }
          }
        } catch {
          continue
        }
      }
    } catch {
      continue
    }
  }

  return Array.from(allForms)
}
