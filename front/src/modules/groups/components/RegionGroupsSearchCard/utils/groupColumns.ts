import type { IRegionGroupSearchItem } from '@/shared/types'
import type { TableColumn } from '@/types'

export const groupColumns: TableColumn<IRegionGroupSearchItem>[] = [
  {
    key: 'name',
    header: 'Название',
    sortable: true,
    sortValue: (item) => item.name?.toLowerCase() ?? '',
  },
  {
    key: 'members_count',
    header: 'Участники',
    sortable: true,
    sortValue: (item) => item.members_count ?? null,
  },
  {
    key: 'city',
    header: 'Город',
    sortable: true,
    sortValue: (item) => {
      const city = item.city
      if (!city) return ''
      if (typeof city === 'string') return city.toLowerCase()
      if (typeof city === 'object') {
        if ('title' in city && typeof city.title === 'string') return city.title.toLowerCase()
        if ('name' in city && typeof city.name === 'string') return city.name.toLowerCase()
      }
      return ''
    },
  },
]
