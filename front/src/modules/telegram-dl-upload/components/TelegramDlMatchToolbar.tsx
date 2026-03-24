import { Download, Play, Table2 } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import SectionCard from '@/shared/components/SectionCard'
import type { TelegramDlMatchRun } from '@/modules/telegram-dl-upload/api/telegramDlUpload.api'

interface TelegramDlMatchToolbarProps {
  viewMode: 'contacts' | 'results'
  contactsCount: number
  matchResultsCount: number
  activeMatchRun: TelegramDlMatchRun | null
  isCreatingMatchRun: boolean
  isExportingMatchRun: boolean
  onRunMatch: () => void
  onShowContacts: () => void
  onExport: () => void
}

export default function TelegramDlMatchToolbar({
  viewMode,
  contactsCount,
  matchResultsCount,
  activeMatchRun,
  isCreatingMatchRun,
  isExportingMatchRun,
  onRunMatch,
  onShowContacts,
  onExport,
}: TelegramDlMatchToolbarProps) {
  const canExport = activeMatchRun?.status === 'DONE'
  const statusLabel = viewMode === 'contacts' ? 'Вся база' : 'Результаты последнего запуска'

  return (
    <SectionCard
      title="Матчинг DL"
      description="Рабочий режим для полной DL-базы и результата последнего сопоставления."
      className="border border-white/10 bg-slate-950/80 text-slate-100 shadow-soft-md backdrop-blur-2xl"
      headerClassName="border-white/10"
      contentClassName="space-y-3"
      headerActions={
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={viewMode === 'contacts' ? 'default' : 'outline'}
            onClick={onShowContacts}
            className="gap-2"
          >
            <Table2 className="size-4" />
            Показать всю DL-базу
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onRunMatch}
            disabled={isCreatingMatchRun}
            className="gap-2"
          >
            <Play className="size-4" />
            {isCreatingMatchRun ? 'Проверяю...' : 'Найти совпадения в tgmbase'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onExport}
            disabled={!canExport || isExportingMatchRun}
            className="gap-2"
          >
            <Download className="size-4" />
            {isExportingMatchRun ? 'Выгрузка...' : 'Выгрузить XLSX'}
          </Button>
        </div>
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="border-cyan-400/30 bg-cyan-400/10 text-cyan-100">
          Режим: {statusLabel}
        </Badge>
        <Badge variant="outline" className="border-white/15 bg-white/5 text-slate-100">
          DL: {contactsCount}
        </Badge>
        <Badge variant="outline" className="border-white/15 bg-white/5 text-slate-100">
          Совпадения: {matchResultsCount}
        </Badge>
        {activeMatchRun ? (
          <Badge variant="outline" className="border-cyan-400/30 bg-cyan-400/10 text-cyan-100">
            Запуск: {activeMatchRun.status}
          </Badge>
        ) : (
          <Badge variant="outline" className="border-white/15 bg-white/5 text-slate-300">
            Запуск не выбран
          </Badge>
        )}
      </div>

      {activeMatchRun ? (
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
            <div className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Проверено</div>
            <div className="mt-1 text-lg font-semibold text-white">{activeMatchRun.contactsTotal}</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
            <div className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Совпадений</div>
            <div className="mt-1 text-lg font-semibold text-white">{activeMatchRun.matchesTotal}</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
            <div className="text-[11px] uppercase tracking-[0.24em] text-slate-400">ID</div>
            <div className="mt-1 text-lg font-semibold text-white">
              {activeMatchRun.strictMatchesTotal}
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
            <div className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Username</div>
            <div className="mt-1 text-lg font-semibold text-white">
              {activeMatchRun.usernameMatchesTotal}
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
            <div className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Phone</div>
            <div className="mt-1 text-lg font-semibold text-white">
              {activeMatchRun.phoneMatchesTotal}
            </div>
          </div>
        </div>
      ) : null}
    </SectionCard>
  )
}
