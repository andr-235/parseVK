import SectionCard from '@/shared/components/SectionCard'
import { LoadingState } from '@/shared/components/LoadingState'
import { EmptyState } from '@/shared/components/EmptyState'
import TelegramDlMatchToolbar from './TelegramDlMatchToolbar'
import TelegramDlContactsTable from './TelegramDlContactsTable'
import TelegramDlMatchResultsTable from './TelegramDlMatchResultsTable'
import type { UseTelegramDlUploadResult } from '../hooks/useTelegramDlUpload.types'

interface TelegramDlMatchWorkspaceProps {
  state: UseTelegramDlUploadResult
}

export default function TelegramDlMatchWorkspace({ state }: TelegramDlMatchWorkspaceProps) {
  const {
    contacts,
    contactsTotal,
    contactsPageSize,
    contactsPageIndex,
    contactsPageCount,
    isContactsLoading,
    contactsError,
    contactsFileFilter,
    contactsTelegramIdFilter,
    contactsUsernameFilter,
    contactsPhoneFilter,
    setContactsFileFilter,
    setContactsTelegramIdFilter,
    setContactsUsernameFilter,
    setContactsPhoneFilter,
    goToNextContactsPage,
    goToPreviousContactsPage,
    canGoToNextContactsPage,
    canGoToPreviousContactsPage,
    matchResults,
    isMatchRunLoading,
    matchRunError,
    displayMode,
    activeMatchRun,
    isCreatingMatchRun,
    isExportingMatchRun,
    runMatch,
    showContacts,
    exportActiveRun,
  } = state

  if (contactsError) {
    return (
      <SectionCard
        title="Telegram DL Match"
        className="border border-white/10 bg-slate-950/80 text-slate-100 shadow-soft-md backdrop-blur-2xl"
      >
        <EmptyState
          variant="custom"
          title="Не удалось загрузить DL-контакты"
          description={contactsError instanceof Error ? contactsError.message : 'Ошибка запроса'}
        />
      </SectionCard>
    )
  }

  if (matchRunError && displayMode === 'results') {
    return (
      <SectionCard
        title="Telegram DL Match"
        className="border border-white/10 bg-slate-950/80 text-slate-100 shadow-soft-md backdrop-blur-2xl"
      >
        <EmptyState
          variant="custom"
          title="Не удалось загрузить результаты"
          description={matchRunError instanceof Error ? matchRunError.message : 'Ошибка запроса'}
        />
      </SectionCard>
    )
  }

  return (
    <div className="space-y-4">
      <TelegramDlMatchToolbar
        viewMode={displayMode}
        contactsCount={contactsTotal}
        matchResultsCount={matchResults.length}
        activeMatchRun={activeMatchRun}
        isCreatingMatchRun={isCreatingMatchRun}
        isExportingMatchRun={isExportingMatchRun}
        onRunMatch={() => void runMatch()}
        onShowContacts={showContacts}
        onExport={() => void exportActiveRun()}
      />

      {displayMode === 'contacts' ? (
        <TelegramDlContactsTable
          contacts={contacts}
          total={contactsTotal}
          pageIndex={contactsPageIndex}
          pageCount={contactsPageCount}
          pageSize={contactsPageSize}
          isLoading={isContactsLoading}
          fileFilter={contactsFileFilter}
          telegramIdFilter={contactsTelegramIdFilter}
          usernameFilter={contactsUsernameFilter}
          phoneFilter={contactsPhoneFilter}
          onFileFilterChange={setContactsFileFilter}
          onTelegramIdFilterChange={setContactsTelegramIdFilter}
          onUsernameFilterChange={setContactsUsernameFilter}
          onPhoneFilterChange={setContactsPhoneFilter}
          onNextPage={goToNextContactsPage}
          onPreviousPage={goToPreviousContactsPage}
          canGoToNextPage={canGoToNextContactsPage}
          canGoToPreviousPage={canGoToPreviousContactsPage}
        />
      ) : isMatchRunLoading ? (
        <LoadingState message="Загружаю результаты матчинга" />
      ) : (
        <TelegramDlMatchResultsTable
          results={matchResults}
          isLoading={isMatchRunLoading}
          activeMatchRun={activeMatchRun}
        />
      )}
    </div>
  )
}
