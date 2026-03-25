import { useMutation, useQuery } from '@tanstack/react-query'
import { useDeferredValue, useState } from 'react'
import { queryClient } from '@/shared/api'
import { telegramDlUploadQueryKeys } from '@/modules/telegram-dl-upload/api/queryKeys'
import {
  telegramDlUploadService,
  type TelegramDlImportContactsPage,
  type TelegramDlImportUploadResponse,
} from '@/modules/telegram-dl-upload/api/telegramDlUpload.api'
import type { UseTelegramDlUploadResult } from './useTelegramDlUpload.types'

const CONTACTS_PAGE_SIZE = 100

const EMPTY_CONTACTS_PAGE: TelegramDlImportContactsPage = {
  items: [],
  total: 0,
  limit: CONTACTS_PAGE_SIZE,
  offset: 0,
}

export const useTelegramDlUpload = (): UseTelegramDlUploadResult => {
  const [contactsFileFilter, setContactsFileFilter] = useState('')
  const [contactsTelegramIdFilter, setContactsTelegramIdFilter] = useState('')
  const [contactsUsernameFilter, setContactsUsernameFilter] = useState('')
  const [contactsPhoneFilter, setContactsPhoneFilter] = useState('')
  const [contactsOffset, setContactsOffset] = useState(0)
  const deferredFileFilter = useDeferredValue(contactsFileFilter)
  const deferredTelegramIdFilter = useDeferredValue(contactsTelegramIdFilter)
  const deferredUsernameFilter = useDeferredValue(contactsUsernameFilter)
  const deferredPhoneFilter = useDeferredValue(contactsPhoneFilter)

  const filesQuery = useQuery({
    queryKey: telegramDlUploadQueryKeys.files(),
    queryFn: telegramDlUploadService.getFiles,
  })

  const contactsQueryParams = {
    fileName: deferredFileFilter,
    telegramId: deferredTelegramIdFilter,
    username: deferredUsernameFilter,
    phone: deferredPhoneFilter,
    limit: CONTACTS_PAGE_SIZE,
    offset: contactsOffset,
  }

  const contactsQuery = useQuery({
    queryKey: telegramDlUploadQueryKeys.contacts(contactsQueryParams),
    queryFn: () => telegramDlUploadService.getContacts(contactsQueryParams),
  })

  const matchRunsQuery = useQuery({
    queryKey: telegramDlUploadQueryKeys.matchRuns(),
    queryFn: telegramDlUploadService.getMatchRuns,
  })

  const [viewMode, setViewMode] = useState<'contacts' | 'results'>('contacts')
  const [activeMatchRunId, setActiveMatchRunId] = useState<string | null>(null)

  const activeMatchRunQuery = useQuery({
    queryKey: activeMatchRunId
      ? telegramDlUploadQueryKeys.matchRun(activeMatchRunId)
      : ['telegram-dl-upload', 'match-run', 'idle'],
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
        queryKey: telegramDlUploadQueryKeys.all,
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

  const activeMatchRun = activeMatchRunQuery.data ?? createMatchRunMutation.data ?? null

  const contactsPage = contactsQuery.data ?? EMPTY_CONTACTS_PAGE
  const contacts = contactsPage.items
  const contactsPageIndex = Math.floor(contactsPage.offset / contactsPage.limit) + 1
  const contactsPageCount = Math.max(1, Math.ceil(contactsPage.total / contactsPage.limit))
  const canGoToPreviousContactsPage = contactsPage.offset > 0
  const canGoToNextContactsPage = contactsPage.offset + contactsPage.items.length < contactsPage.total
  const matchResults = matchResultsQuery.data ?? []
  const matchRuns = matchRunsQuery.data ?? []

  const showContacts = () => setViewMode('contacts')

  const updateContactsFilter = (
    setter: (value: string) => void,
    value: string,
  ) => {
    setter(value)
    setContactsOffset(0)
  }

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

  const goToNextContactsPage = () => {
    if (!canGoToNextContactsPage) {
      return
    }

    setContactsOffset((current) => current + CONTACTS_PAGE_SIZE)
  }

  const goToPreviousContactsPage = () => {
    if (!canGoToPreviousContactsPage) {
      return
    }

    setContactsOffset((current) => Math.max(0, current - CONTACTS_PAGE_SIZE))
  }

  return {
    files: filesQuery.data ?? [],
    isFilesLoading: filesQuery.isLoading,
    filesError: filesQuery.error,
    uploadFiles: uploadMutation.mutateAsync,
    isUploading: uploadMutation.isPending,
    uploadError: uploadMutation.error,
    uploadResult: uploadMutation.data as TelegramDlImportUploadResponse | undefined,
    contactsPage,
    contacts,
    contactsTotal: contactsPage.total,
    contactsPageIndex,
    contactsPageCount,
    contactsPageSize: contactsPage.limit,
    isContactsLoading: contactsQuery.isLoading,
    contactsError: contactsQuery.error,
    setContactsFileFilter: (value) => updateContactsFilter(setContactsFileFilter, value),
    setContactsTelegramIdFilter: (value) =>
      updateContactsFilter(setContactsTelegramIdFilter, value),
    setContactsUsernameFilter: (value) => updateContactsFilter(setContactsUsernameFilter, value),
    setContactsPhoneFilter: (value) => updateContactsFilter(setContactsPhoneFilter, value),
    contactsFileFilter,
    contactsTelegramIdFilter,
    contactsUsernameFilter,
    contactsPhoneFilter,
    goToNextContactsPage,
    goToPreviousContactsPage,
    canGoToNextContactsPage,
    canGoToPreviousContactsPage,
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
