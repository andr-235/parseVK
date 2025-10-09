import {Button} from '../components/ui/button'
import type { TableColumn, Group } from '../types'

const GROUP_TYPE_LABELS: Record<string, string> = {
  group: 'группа',
  page: 'страница',
  event: 'событие'
}

export const getGroupTableColumns = (deleteGroup: (id: number) => void): TableColumn[] => [
  {
    header: 'ID',
    key: 'id',
    cellClassName: 'table-cell-nowrap',
    headerClassName: 'table-cell-nowrap'
  },
  {
    header: 'Фото',
    key: 'photo',
    render: (item: Group) => (
      item.photo50 ? <img src={item.photo50} alt={item.name} style={{ width: 50, height: 50, borderRadius: '50%' }} /> : '-'
    )
  },
  {
    header: 'VK ID',
    key: 'vkId'
  },
  {
    header: 'Название',
    key: 'name'
  },
  {
    header: 'Screen Name',
    key: 'screenName',
    render: (item: Group) => item.screenName || '-'
  },
  {
    header: 'Тип',
    key: 'type',
    cellClassName: 'table-cell-nowrap',
    headerClassName: 'table-cell-nowrap',
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
    expandable: true,
    truncateAt: 240,
    emptyValue: '-',
    cellClassName: 'table-cell-description',
    headerClassName: 'table-cell-description'
  },
  {
    header: 'Участники',
    key: 'membersCount',
    render: (item: Group) => item.membersCount?.toLocaleString() || '-'
  },
  {
    header: 'Статус',
    key: 'status',
    render: (item: Group) => item.status || '-'
  },
  {
    header: 'Закрытая',
    key: 'isClosed',
    render: (item: Group) => item.isClosed === 1 ? 'Да' : item.isClosed === 0 ? 'Нет' : '-'
  },
  {
    header: 'Действия',
    key: 'actions',
    cellClassName: 'table-cell-actions',
    headerClassName: 'table-cell-actions',
    render: (item: Group) => (
      <div className="table-actions">
        <Button
          onClick={() => {
            window.open(`https://vk.com/${item.screenName || `club${item.vkId}`}`, '_blank')
          }}
        >
          Перейти
        </Button>
        <Button onClick={() => deleteGroup(item.id)}>
          Удалить
        </Button>
      </div>
    )
  }
]
