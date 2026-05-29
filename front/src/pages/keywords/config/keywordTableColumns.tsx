import type { Keyword, TableColumn } from '@/shared/types'

export const getKeywordTableColumns = (): TableColumn<Keyword>[] => [
  {
    header: 'Ключевое слово',
    key: 'word',
    sortable: true,
  },
  {
    header: 'Категория',
    key: 'category',
    sortable: true,
  },
]
