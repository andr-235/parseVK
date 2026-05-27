import { useCallback, useState } from 'react'
import {
  vkFriendsExportService,
  type VkFriendsParams,
} from '@/api/vkFriendsExport/vkFriendsExport.api'
import { toOptionalNumber } from '@/utils/common/exportUtils'
import { useExportJobStream } from '@/hooks/common/useExportJobStream'

type FormState = {
  userId: string
}

export const useVkFriendsExport = () => {
  const [formState, setFormState] = useState<FormState>({
    userId: '',
  })

  const updateField = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setFormState((prev) => ({
      ...prev,
      [key]: value,
    }))
  }, [])

  const buildParams = useCallback((): VkFriendsParams => {
    const params: VkFriendsParams = {}

    const userId = toOptionalNumber(formState.userId)
    if (userId !== undefined) {
      params.user_id = userId
    }

    return params
  }, [formState.userId])

  const exportState = useExportJobStream<VkFriendsParams>({
    service: vkFriendsExportService,
    buildParams,
    exportErrorMessage: 'Не удалось запустить экспорт ВКонтакте',
    fetchErrorMessage: 'Не удалось загрузить статус экспорта ВКонтакте',
  })

  return {
    formState,
    updateField,
    ...exportState,
  }
}
