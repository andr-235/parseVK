import { useMutation, useQuery } from '@tanstack/react-query'
import { queryClient } from '@/shared/api'
import { telegramDlUploadQueryKeys } from '@/modules/telegram-dl-upload/api/queryKeys'
import {
  telegramDlUploadService,
  type TelegramDlImportUploadResponse,
} from '@/modules/telegram-dl-upload/api/telegramDlUpload.api'

export const useTelegramDlUpload = () => {
  const filesQuery = useQuery({
    queryKey: telegramDlUploadQueryKeys.files(),
    queryFn: telegramDlUploadService.getFiles,
  })

  const uploadMutation = useMutation({
    mutationKey: telegramDlUploadQueryKeys.all,
    mutationFn: (files: File[]) => telegramDlUploadService.upload(files),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: telegramDlUploadQueryKeys.files(),
      })
    },
  })

  return {
    files: filesQuery.data ?? [],
    isFilesLoading: filesQuery.isLoading,
    filesError: filesQuery.error,
    uploadFiles: uploadMutation.mutateAsync,
    isUploading: uploadMutation.isPending,
    uploadError: uploadMutation.error,
    uploadResult: uploadMutation.data as TelegramDlImportUploadResponse | undefined,
  }
}
