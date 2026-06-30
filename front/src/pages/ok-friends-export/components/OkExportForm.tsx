import { FriendsExportForm } from '../../friends-export/components/FriendsExportForm'
import type { StartOkFriendsExportParams } from '../../../shared/api/ok-friends'

type OkExportFormProps = {
  onSubmit: (params: StartOkFriendsExportParams) => void
  disabled: boolean
  isLoading: boolean
}

export function OkExportForm({ onSubmit, disabled, isLoading }: OkExportFormProps) {
  return (
    <FriendsExportForm<StartOkFriendsExportParams>
      label="ID пользователя OK"
      placeholder="1234567890"
      inputId="ok-fid"
      inputType="text"
      inputMode="numeric"
      disabled={disabled}
      isLoading={isLoading}
      validate={(value) => !/^\d+$/.test(value) ? 'ID должен содержать только цифры' : null}
      errorMessage="Введите ID пользователя OK"
      buildParams={(value) => ({ fid: value })}
      onSubmit={onSubmit}
    />
  )
}
