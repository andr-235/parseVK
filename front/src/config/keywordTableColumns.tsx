import {Button} from '../components/ui/button'
import type { TableColumn, Keyword } from '../types'

export const getKeywordTableColumns = (deleteKeyword: (id: number) => Promise<void>): TableColumn[] => [
  {
    header: '№',
    key: 'index',
    render: (_: Keyword, index: number) => index + 1,
    sortable: false
  },
  {
    header: 'Ключевое слово',
    key: 'word',
    sortable: true
  },
  {
    header: 'Действия',
    key: 'actions',
    render: (item: Keyword) => (
      <Button
        onClick={async () => {
          try {
            await deleteKeyword(item.id)
          } catch (error) {
            console.error('Failed to delete keyword', error)
          }
        }}
      >
        Удалить
      </Button>
    ),
    sortable: false
  }
]
