import { Button } from '@/components/ui/button'
import { ExpandableText } from '@/components/ExpandableText'
import type { TableColumn, Group } from '@/types'

const GROUP_TYPE_LABELS: Record<string, string> = {
  group: 'группа',
  page: 'страница',
  event: 'событие',
}

const renderGroupPhoto = (item: Group) => {
  if (!item.photo50) {
    return '-'
  }
  return (
    <img
      src={item.photo50}
      alt={item.name}
      style={{ width: 50, height: 50, borderRadius: '50%' }}
    />
  )
}

const renderGroupType = (item: Group) => {
  if (!item.type) {
    return '-'
  }
  return GROUP_TYPE_LABELS[item.type] || item.type
}

const renderGroupDescription = (item: Group) => (
  <ExpandableText text={item.description || ''} maxLength={50} />
)

const renderGroupStatus = (item: Group) => (
  <ExpandableText text={item.status || ''} maxLength={50} />
)

const renderGroupIsClosed = (item: Group) => {
  if (item.isClosed === 1) return 'Да'
  if (item.isClosed === 0) return 'Нет'
  return '-'
}

const renderGroupActions = (item: Group, deleteGroup: (id: number) => void) => {
  const handleOpenVk = () => {
    const url = item.screenName
      ? `https://vk.com/${item.screenName}`
      : `https://vk.com/club${item.vkId}`
    window.open(url, '_blank')
  }

  const handleDelete = () => {
    deleteGroup(item.id)
  }

  return (
    <div className="table-actions flex gap-2">
      <Button size="sm" onClick={handleOpenVk}>
        Перейти
      </Button>
      <Button size="sm" variant="destructive" onClick={handleDelete}>
        Удалить
      </Button>
    </div>
  )
}

export const getGroupTableColumns = (deleteGroup: (id: number) => void): TableColumn<Group>[] => [
  {
    header: 'ID',
    key: 'id',
    cellClassName: 'table-cell-nowrap w-[80px]',
    headerClassName: 'table-cell-nowrap w-[80px]',
    sortable: true,
    sortValue: (item: Group) => item.id,
  },
  {
    header: 'Фото',
    key: 'photo',
    cellClassName: 'w-[70px]',
    headerClassName: 'w-[70px]',
    sortable: false,
    render: renderGroupPhoto,
  },
  {
    header: 'VK ID',
    key: 'vkId',
    cellClassName: 'table-cell-nowrap w-[100px]',
    headerClassName: 'table-cell-nowrap w-[100px]',
    sortable: true,
    sortValue: (item: Group) => item.vkId,
  },
  {
    header: 'Название',
    key: 'name',
    cellClassName: 'max-w-[200px] truncate',
    headerClassName: 'w-[200px]',
    sortable: true,
    sortValue: (item: Group) => item.name?.toLowerCase() ?? '',
  },
  {
    header: 'Screen Name',
    key: 'screenName',
    cellClassName: 'max-w-[150px] truncate',
    headerClassName: 'w-[150px]',
    sortable: true,
    sortValue: (item: Group) => item.screenName?.toLowerCase() ?? '',
    render: (item: Group) => item.screenName || '-',
  },
  {
    header: 'Тип',
    key: 'type',
    cellClassName: 'table-cell-nowrap',
    headerClassName: 'table-cell-nowrap',
    sortable: true,
    sortValue: (item: Group) => item.type?.toLowerCase() ?? '',
    render: renderGroupType,
  },
  {
    header: 'Описание',
    key: 'description',
    cellClassName: 'table-cell-description max-w-[250px]',
    headerClassName: 'table-cell-description w-[250px]',
    sortable: true,
    sortValue: (item: Group) => item.description?.toLowerCase() ?? '',
    render: renderGroupDescription,
  },
  {
    header: 'Участники',
    key: 'membersCount',
    cellClassName: 'table-cell-nowrap w-[120px]',
    headerClassName: 'table-cell-nowrap w-[120px]',
    sortable: true,
    sortValue: (item: Group) => item.membersCount ?? null,
    render: (item: Group) => item.membersCount?.toLocaleString() || '-',
  },
  {
    header: 'Статус',
    key: 'status',
    cellClassName: 'max-w-[150px]',
    headerClassName: 'w-[150px]',
    sortable: true,
    sortValue: (item: Group) => item.status?.toLowerCase() ?? '',
    render: renderGroupStatus,
  },
  {
    header: 'Закрытая',
    key: 'isClosed',
    cellClassName: 'table-cell-nowrap w-[100px]',
    headerClassName: 'table-cell-nowrap w-[100px]',
    sortable: true,
    sortValue: (item: Group) => (typeof item.isClosed === 'number' ? item.isClosed : null),
    render: renderGroupIsClosed,
  },
  {
    header: 'Действия',
    key: 'actions',
    cellClassName: 'table-cell-actions sticky right-0 bg-background-primary',
    headerClassName: 'table-cell-actions sticky right-0 bg-background-primary w-[180px]',
    sortable: false,
    render: (item: Group) => renderGroupActions(item, deleteGroup),
  },
]
