import type { IRegionGroupSearchItem, TableColumn } from '@/shared/types'

export const formatCity = (group: IRegionGroupSearchItem): string => {
  const city = group.city
  if (!city) return '\u2014'
  if (typeof city === 'string') return city
  if (typeof city === 'object') {
    if ('title' in city && typeof city.title === 'string') return city.title
    if ('name' in city && typeof city.name === 'string') return city.name
  }
  return '\u2014'
}

export const formatMembers = (group: IRegionGroupSearchItem): string => {
  if (typeof group.members_count === 'number') return group.members_count.toLocaleString('ru-RU')
  return '\u2014'
}

export const vkLink = (group: IRegionGroupSearchItem) =>
  `https://vk.com/${group.screen_name ?? `club${group.id}`}`

export const regionSortColumns: TableColumn<IRegionGroupSearchItem>[] = [
  { key: 'name', header: 'Название', sortable: true },
  { key: 'members_count', header: 'Участники', sortable: true },
  { key: 'city', header: 'Город', sortable: true },
]
