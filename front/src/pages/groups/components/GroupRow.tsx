import { memo } from 'react'
import { Building2, CheckCircle, XCircle, Trash2 } from 'lucide-react'
import { Button, ConfirmAction, Checkbox } from '../../../components/ui'
import type { Group } from '../../../shared/api/groups'

export type ActionState = {
  deleting: number | null
  confirmDelete: number | null
}

type Props = {
  group: Group
  checked: boolean
  actionState: ActionState
  isFocused: boolean
  onDelete: (id: number) => void
  onConfirmDelete: (id: number) => void
  onCancelDelete: () => void
  onToggle: (id: number) => void
}

const PROFILE_URL = (g: Group) =>
  g.screenName ? `https://vk.com/${g.screenName}` : `https://vk.com/club${g.vkGroupId}`

export const GroupRow = memo(function GroupRow({
  group,
  checked,
  actionState,
  onDelete,
  onConfirmDelete,
  onCancelDelete,
  onToggle,
  isFocused,
}: Props) {
  const isDeleting = actionState.deleting === group.vkGroupId
  const isConfirmingDelete = actionState.confirmDelete === group.vkGroupId

  return (
    <tr className={`border-b border-border last:border-0 transition-colors duration-150 ${
      isFocused
        ? 'bg-bg-hover ring-1 ring-inset ring-accent/20'
        : 'hover:bg-bg-hover'
    }`}>
      <td className="w-10 px-3 py-2">
        <Checkbox
          checked={checked}
          onChange={() => onToggle(group.vkGroupId)}
          aria-label={`\u0412\u044B\u0431\u0440\u0430\u0442\u044C ${group.name ?? ''}`}
        />
      </td>
      <td className="px-3 py-2">
        {group.photo50 ? (
          <img
            src={group.photo50}
            alt=""
            className="h-8 w-8 rounded object-cover"
            loading="lazy"
          />
        ) : (
          <span
            className="inline-flex h-8 w-8 items-center justify-center rounded bg-bg-hover text-text-muted"
            role="img"
            aria-label="\u0410\u0432\u0430\u0442\u0430\u0440 \u043E\u0442\u0441\u0443\u0442\u0441\u0442\u0432\u0443\u0435\u0442"
          >
            <Building2 size={14} />
          </span>
        )}
      </td>
      <td className="px-3 py-2">
        <a
          href={PROFILE_URL(group)}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-sm font-medium text-text-primary hover:text-accent transition-colors duration-150"
        >
          {group.name || group.screenName || `\u0413\u0440\u0443\u043F\u043F\u0430 #${group.vkGroupId}`}
        </a>
        {group.screenName && (
          <span className="text-xs text-text-muted">@{group.screenName}</span>
        )}
      </td>
      <td className="px-3 py-2 text-sm text-text-secondary">
        {group.type === 'group' ? '\u0421\u043E\u043E\u0431\u0449\u0435\u0441\u0442\u0432\u043E'
          : group.type === 'page' ? '\u0421\u0442\u0440\u0430\u043D\u0438\u0446\u0430'
          : group.type === 'event' ? '\u041C\u0435\u0440\u043E\u043F\u0440\u0438\u044F\u0442\u0438\u0435'
          : group.type || '\u2014'}
      </td>
      <td className="px-3 py-2 text-sm text-text-secondary tabular-nums">
        {group.membersCount !== null && group.membersCount !== undefined
          ? group.membersCount.toLocaleString('ru-RU')
          : '\u2014'}
      </td>
      <td className="px-3 py-2 text-sm text-text-secondary">
        {group.city?.title || '\u2014'}
      </td>
      <td className="px-3 py-2">
        {group.verified ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
            <CheckCircle size={13} />
            {'\u0414\u0430'}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs text-text-muted">
            <XCircle size={13} />
            {'\u041D\u0435\u0442'}
          </span>
        )}
      </td>
      <td className="px-3 py-2 text-sm text-text-secondary tabular-nums">
        {group.updatedAt
          ? new Date(group.updatedAt).toLocaleDateString('ru-RU')
          : '\u2014'}
      </td>
      <td className="px-3 py-2">
        {isConfirmingDelete ? (
          <ConfirmAction
            onConfirm={() => onDelete(group.vkGroupId)}
            onCancel={onCancelDelete}
            isLoading={isDeleting}
            showIcon
          />
        ) : (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost" size="xs" semantic="danger"
              className="max-sm:min-h-[44px] max-sm:min-w-[44px]"
              onClick={() => onConfirmDelete(group.vkGroupId)}
              disabled={isDeleting}
              aria-label={`\u0423\u0434\u0430\u043B\u0438\u0442\u044C ${group.name ?? ''}`}
              icon={<Trash2 size={13} />}
            >
              {'Удалить'}
            </Button>
          </div>
        )}
      </td>
    </tr>
  )
})
