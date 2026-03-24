import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { queryClient } from '@/shared/api'
import { telegramDlUploadQueryKeys } from '@/modules/telegram-dl-upload/api/queryKeys'
import {
  telegramDlUploadService,
  type TelegramDlImportUploadResponse,
} from '@/modules/telegram-dl-upload/api/telegramDlUpload.api'
import type { UseTelegramDlUploadResult } from './useTelegramDlUpload.types'

export const useTelegramDlUpload = (): UseTelegramDlUploadResult => {
  const filesQuery = useQuery({
    queryKey: telegramDlUploadQueryKeys.files(),
    queryFn: telegramDlUploadService.getFiles,
  })

  const contactsQuery = useQuery({
    queryKey: telegramDlUploadQueryKeys.contacts(),
    queryFn: telegramDlUploadService.getContacts,
  })

  const matchRunsQuery = useQuery({
    queryKey: telegramDlUploadQueryKeys.matchRuns(),
    queryFn: telegramDlUploadService.getMatchRuns,
  })

  const [viewMode, setViewMode] = useState<'contacts' | 'results'>('contacts')
  const [activeMatchRunId, setActiveMatchRunId] = useState<string | null>(null)

  const activeMatchRunQuery = useQuery({
    queryKey: activeMatchRunId ? telegramDlUploadQueryKeys.matchRun(activeMatchRunId) : ['telegram-dl-upload', 'match-run', 'idle'],
    queryFn: () => telegramDlUploadService.getMatchRun(activeMatchRunId ?? ''),
    enabled: activeMatchRunId !== null,
  })

  const matchResultsQuery = useQuery({
    queryKey: activeMatchRunId
      ? telegramDlUploadQueryKeys.matchResults(activeMatchRunId)
      : ['telegram-dl-upload', 'match-results', 'idle'],
    queryFn: () => telegramDlUploadService.getMatchResults(activeMatchRunId ?? ''),
    enabled: activeMatchRunId !== null && viewMode === 'results',
  })

  const uploadMutation = useMutation({
    mutationKey: telegramDlUploadQueryKeys.all,
    mutationFn: (files: File[]) => telegramDlUploadService.upload(files),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: telegramDlUploadQueryKeys.files(),
      })
      await queryClient.invalidateQueries({
        queryKey: telegramDlUploadQueryKeys.contacts(),
      })
    },
  })

  const createMatchRunMutation = useMutation({
    mutationKey: [...telegramDlUploadQueryKeys.all, 'create-match-run'] as const,
    mutationFn: telegramDlUploadService.createMatchRun,
    onSuccess: async (run) => {
      setActiveMatchRunId(run.id)
      setViewMode('results')
      await queryClient.invalidateQueries({
        queryKey: telegramDlUploadQueryKeys.matchRuns(),
      })
      await queryClient.invalidateQueries({
        queryKey: telegramDlUploadQueryKeys.matchRun(run.id),
      })
      await queryClient.invalidateQueries({
        queryKey: telegramDlUploadQueryKeys.matchResults(run.id),
      })
    },
  })

  const exportMatchRunMutation = useMutation({
    mutationKey: [...telegramDlUploadQueryKeys.all, 'export-match-run'] as const,
    mutationFn: (runId: string) => telegramDlUploadService.exportMatchRun(runId),
  })

  const activeMatchRun =
    activeMatchRunQuery.data ?? createMatchRunMutation.data ?? null

  const contacts = contactsQuery.data ?? []
  const matchResults = matchResultsQuery.data ?? []
  const matchRuns = matchRunsQuery.data ?? []

  const showContacts = () => setViewMode('contacts')

  const runMatch = async () => {
    const run = await createMatchRunMutation.mutateAsync()
    setActiveMatchRunId(run.id)
    setViewMode('results')
    return run
  }

  const exportActiveRun = async () => {
    if (!activeMatchRun?.id) {
      return
    }

    await exportMatchRunMutation.mutateAsync(activeMatchRun.id)
  }

  return {
    files: filesQuery.data ?? [],
    isFilesLoading: filesQuery.isLoading,
    filesError: filesQuery.error,
    uploadFiles: uploadMutation.mutateAsync,
    isUploading: uploadMutation.isPending,
    uploadError: uploadMutation.error,
    uploadResult: uploadMutation.data as TelegramDlImportUploadResponse | undefined,
    contacts,
    isContactsLoading: contactsQuery.isLoading,
    contactsError: contactsQuery.error,
    matchRuns,
    isMatchRunsLoading: matchRunsQuery.isLoading,
    matchRunsError: matchRunsQuery.error,
    activeMatchRun,
    matchResults,
    isMatchRunLoading:
      activeMatchRunId !== null &&
      (activeMatchRunQuery.isLoading || (viewMode === 'results' && matchResultsQuery.isLoading)),
    matchRunError: activeMatchRunQuery.error ?? matchResultsQuery.error,
    displayMode: viewMode,
    showContacts,
    runMatch,
    isCreatingMatchRun: createMatchRunMutation.isPending,
    exportActiveRun,
    isExportingMatchRun: exportMatchRunMutation.isPending,
  }
}
