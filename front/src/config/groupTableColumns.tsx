import { Button } from '../components/ui/button'
import { ExpandableText } from '../components/ExpandableText'
import type { TableColumn, Group } from '../types'

const GROUP_TYPE_LABELS: Record<string, string> = {
  group: 'группа',
  page: 'страница',
  event: 'событие'
}

export const getGroupTableColumns = (deleteGroup: (id: number) => void): TableColumn<Group>[] => [
  {
    header: 'ID',
    key: 'id',
    cellClassName: 'table-cell-nowrap w-[80px]',
    headerClassName: 'table-cell-nowrap w-[80px]',
    sortable: true,
    sortValue: (item: Group) => item.id
  },
  {
    header: 'Фото',
    key: 'photo',
    cellClassName: 'w-[70px]',
    headerClassName: 'w-[70px]',
    sortable: false,
    render: (item: Group) => (
      item.photo50 ? <img src={item.photo50} alt={item.name} style={{ width: 50, height: 50, borderRadius: '50%' }} /> : '-'
    )
  },
  {
    header: 'VK ID',
    key: 'vkId',
    cellClassName: 'table-cell-nowrap w-[100px]',
    headerClassName: 'table-cell-nowrap w-[100px]',
    sortable: true,
    sortValue: (item: Group) => item.vkId
  },
  {
    header: 'Название',
    key: 'name',
    cellClassName: 'max-w-[200px] truncate',
    headerClassName: 'w-[200px]',
    sortable: true,
    sortValue: (item: Group) => item.name?.toLowerCase() ?? ''
  },
  {
    header: 'Screen Name',
    key: 'screenName',
    cellClassName: 'max-w-[150px] truncate',
    headerClassName: 'w-[150px]',
    sortable: true,
    sortValue: (item: Group) => item.screenName?.toLowerCase() ?? '',
    render: (item: Group) => item.screenName || '-'
  },
  {
    header: 'Тип',
    key: 'type',
    cellClassName: 'table-cell-nowrap',
    headerClassName: 'table-cell-nowrap',
    sortable: true,
    sortValue: (item: Group) => item.type?.toLowerCase() ?? '',
    render: (item: Group) => {
      if (!item.type) {
        return '-'
      }

      return GROUP_TYPE_LABELS[item.type] || item.type
    }
  },
  {
    header: 'Описание',
    key: 'description',
    cellClassName: 'table-cell-description max-w-[250px]',
    headerClassName: 'table-cell-description w-[250px]',
    sortable: true,
    sortValue: (item: Group) => item.description?.toLowerCase() ?? '',
    render: (item: Group) => (
      <ExpandableText text={item.description || ''} maxLength={50} />
    )
  },
  {
    header: 'Участники',
    key: 'membersCount',
    cellClassName: 'table-cell-nowrap w-[120px]',
    headerClassName: 'table-cell-nowrap w-[120px]',
    sortable: true,
    sortValue: (item: Group) => item.membersCount ?? null,
    render: (item: Group) => item.membersCount?.toLocaleString() || '-'
  },
  {
    header: 'Статус',
    key: 'status',
    cellClassName: 'max-w-[150px]',
    headerClassName: 'w-[150px]',
    sortable: true,
    sortValue: (item: Group) => item.status?.toLowerCase() ?? '',
    render: (item: Group) => (
      <ExpandableText text={item.status || ''} maxLength={50} />
    )
  },
  {
    header: 'Закрытая',
    key: 'isClosed',
    cellClassName: 'table-cell-nowrap w-[100px]',
    headerClassName: 'table-cell-nowrap w-[100px]',
    sortable: true,
    sortValue: (item: Group) =>
      typeof item.isClosed === 'number' ? item.isClosed : null,
    render: (item: Group) => item.isClosed === 1 ? 'Да' : item.isClosed === 0 ? 'Нет' : '-'
  },
  {
    header: 'Действия',
    key: 'actions',
    cellClassName: 'table-cell-actions sticky right-0 bg-background-primary',
    headerClassName: 'table-cell-actions sticky right-0 bg-background-primary w-[180px]',
    sortable: false,
    render: (item: Group) => (
      <div className="table-actions flex gap-2">
        <Button
          size="sm"
          onClick={() => {
            window.open(`https://vk.com/${item.screenName || `club${item.vkId}`}`, '_blank')
          }}
        >
          Перейти
        </Button>
        <Button size="sm" variant="destructive" onClick={() => deleteGroup(item.id)}>
          Удалить
        </Button>
      </div>
    )
  }
]
