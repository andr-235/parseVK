import type { IRegionGroupSearchItem } from '@/shared/types'

export const formatCityTitle = (group: IRegionGroupSearchItem): string => {
  const city = group.city
  if (!city) return '—'
  if (typeof city === 'string') return city
  if (typeof city === 'object' && city !== null) {
    if ('title' in city && typeof city.title === 'string') return city.title
    if ('name' in city && typeof city.name === 'string') return city.name
  }
  return '—'
}

export const renderMembersCount = (group: IRegionGroupSearchItem): string => {
  if (typeof group.members_count === 'number') {
    return group.members_count.toLocaleString('ru-RU')
  }
  return '—'
}
