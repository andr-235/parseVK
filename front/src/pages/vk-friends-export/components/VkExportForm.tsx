import { FriendsExportForm } from '../../friends-export/components/FriendsExportForm'
import type { StartVkFriendsExportParams } from '../../../shared/api/vk-friends'

type VkExportFormProps = {
  onSubmit: (params: StartVkFriendsExportParams) => void
  disabled: boolean
  isLoading: boolean
}

export function VkExportForm({ onSubmit, disabled, isLoading }: VkExportFormProps) {
  return (
    <FriendsExportForm<StartVkFriendsExportParams>
      label="ID пользователя VK"
      placeholder="12345"
      inputId="vk-user-id"
      inputType="number"
      min={1}
      disabled={disabled}
      isLoading={isLoading}
      validate={(value) => {
        const num = Number(value)
        return (!Number.isInteger(num) || num <= 0) ? 'ID должен быть целым положительным числом' : null
      }}
      errorMessage="Введите ID пользователя VK"
      buildParams={(value) => ({ user_id: Number(value) })}
      onSubmit={onSubmit}
    />
  )
}
