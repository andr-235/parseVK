import { useCallback, useState } from 'react'
import {
  okFriendsExportService,
  type OkFriendsParams,
} from '@/pages/ok-friends-export/api/okFriendsExport.api'
import { toOptionalNumber, toOptionalString } from '@/utils/common/exportUtils'
import { useExportJobStream } from '@/hooks/common/useExportJobStream'

type FormState = {
  fid: string
  offset: string
  limit: string
}

export const useOkFriendsExport = () => {
  const [formState, setFormState] = useState<FormState>({
    fid: '',
    offset: '',
    limit: '',
  })

  const updateField = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setFormState((prev) => ({
      ...prev,
      [key]: value,
    }))
  }, [])

  const buildParams = useCallback((): OkFriendsParams => {
    const params: OkFriendsParams = {}

    const fid = toOptionalString(formState.fid)
    if (fid !== undefined) {
      params.fid = fid
    }

    const offset = toOptionalNumber(formState.offset)
    if (offset !== undefined) {
      params.offset = offset
    }

    const limit = toOptionalNumber(formState.limit)
    if (limit !== undefined) {
      params.limit = limit
    }

    return params
  }, [formState.fid, formState.offset, formState.limit])

  const exportState = useExportJobStream<OkFriendsParams>({
    service: okFriendsExportService,
    buildParams,
    exportErrorMessage: 'Не удалось запустить экспорт Одноклассников',
    fetchErrorMessage: 'Не удалось загрузить статус экспорта Одноклассников',
  })

  return {
    formState,
    updateField,
    ...exportState,
  }
}
