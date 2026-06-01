import { memo } from 'react'
import { BadgeCheck, Trash2, Loader } from 'lucide-react'
import { Button, ConfirmAction, Checkbox } from '../../../components/ui'
import { AuthorAvatar } from './AuthorAvatar'
import { NumCell } from './NumCell'
import { DateCell } from './DateCell'
import type { Author } from '../../../shared/api/authors'

export type ActionState = {
  verifying: number | null
  deleting: number | null
  confirmDelete: number | null
}

type Props = {
  author: Author
  checked: boolean
  actionState: ActionState
  onVerify: (id: number) => void
  onDelete: (id: number) => void
  onConfirmDelete: (id: number) => void
  onCancelDelete: () => void
  onToggle: (id: number) => void
}

export const AuthorRow = memo(function AuthorRow({
  author,
  checked,
  actionState,
  onVerify,
  onDelete,
  onConfirmDelete,
  onCancelDelete,
  onToggle,
}: Props) {
  const isVerifying = actionState.verifying === author.vkAuthorId
  const isDeleting = actionState.deleting === author.vkAuthorId
  const isConfirmingDelete = actionState.confirmDelete === author.vkAuthorId

  return (
    <tr className="border-b border-border last:border-0 hover:bg-bg-hover transition-colors duration-150">
      <td className="w-10 px-3 py-2">
        <Checkbox
          checked={checked}
          onChange={() => onToggle(author.vkAuthorId)}
          aria-label={`\u0412\u044B\u0431\u0440\u0430\u0442\u044C ${author.fullName}`}
        />
      </td>
      <td className="px-3 py-2">
        <AuthorAvatar author={author} />
      </td>
      <td className="px-3 py-2">
        <a
          href={author.profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-sm font-medium text-text-primary hover:text-accent transition-colors duration-150"
        >
          {author.fullName}
        </a>
        {author.screenName && (
          <span className="text-xs text-text-muted">@{author.screenName}</span>
        )}
      </td>
      <td className="px-3 py-2 text-sm text-text-secondary">
        {author.city?.title || '\u2014'}
      </td>
      <NumCell value={author.photosCount} />
      <NumCell value={author.friendsCount} />
      <NumCell value={author.followersCount} />
      <DateCell value={author.createdAt} />
      <DateCell value={author.lastSeenAt} />
      <td className="px-3 py-2">
        {author.isVerified ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
            <BadgeCheck size={13} />
            {'\u0414\u0430'}
          </span>
        ) : (
          <span className="text-xs text-text-muted">{'\u041D\u0435\u0442'}</span>
        )}
      </td>
      <td className="px-3 py-2">
        {isConfirmingDelete ? (
          <ConfirmAction
            onConfirm={() => onDelete(author.vkAuthorId)}
            onCancel={onCancelDelete}
            isLoading={isDeleting}
            showIcon
          />
        ) : (
          <div className="flex items-center gap-1">
            {!author.isVerified && (
              <Button
                variant="ghost" size="xs" semantic="default"
                className="max-sm:min-h-[44px] max-sm:min-w-[44px]"
                onClick={() => onVerify(author.vkAuthorId)}
                disabled={isVerifying}
                aria-label={`\u0412\u0435\u0440\u0438\u0444\u0438\u0446\u0438\u0440\u043E\u0432\u0430\u0442\u044C ${author.fullName}`}
                icon={<BadgeCheck size={13} />}
              >
                {isVerifying ? <Loader size={13} className="animate-spin" /> : '\u0412\u0435\u0440\u0438\u0444.'}
              </Button>
            )}
            <Button
              variant="ghost" size="xs" semantic="danger"
              className="max-sm:min-h-[44px] max-sm:min-w-[44px]"
              onClick={() => onConfirmDelete(author.vkAuthorId)}
              disabled={isDeleting}
              aria-label={`\u0423\u0434\u0430\u043B\u0438\u0442\u044C ${author.fullName}`}
              icon={<Trash2 size={13} />}
            >
              {'\u0423\u0434\u0430\u043B\u0438\u0442\u042C'}
            </Button>
          </div>
        )}
      </td>
    </tr>
  )
})
