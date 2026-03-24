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
    isContactsLoading,
    contactsError,
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
        contactsCount={contacts.length}
        matchResultsCount={matchResults.length}
        activeMatchRun={activeMatchRun}
        isCreatingMatchRun={isCreatingMatchRun}
        isExportingMatchRun={isExportingMatchRun}
        onRunMatch={() => void runMatch()}
        onShowContacts={showContacts}
        onExport={() => void exportActiveRun()}
      />

      {displayMode === 'contacts' ? (
        <TelegramDlContactsTable contacts={contacts} isLoading={isContactsLoading} />
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
