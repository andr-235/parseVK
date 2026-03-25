import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Input } from '@/shared/ui/input'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table'
import SectionCard from '@/shared/components/SectionCard'
import { EmptyState } from '@/shared/components/EmptyState'
import { LoadingState } from '@/shared/components/LoadingState'
import type { TelegramDlImportContact } from '@/modules/telegram-dl-upload/api/telegramDlUpload.api'

interface TelegramDlContactsTableProps {
  contacts: TelegramDlImportContact[]
  total: number
  pageIndex: number
  pageCount: number
  pageSize: number
  isLoading: boolean
  fileFilter: string
  telegramIdFilter: string
  usernameFilter: string
  phoneFilter: string
  onFileFilterChange: (value: string) => void
  onTelegramIdFilterChange: (value: string) => void
  onUsernameFilterChange: (value: string) => void
  onPhoneFilterChange: (value: string) => void
  onNextPage: () => void
  onPreviousPage: () => void
  canGoToNextPage: boolean
  canGoToPreviousPage: boolean
}

export default function TelegramDlContactsTable({
  contacts,
  total,
  pageIndex,
  pageCount,
  pageSize,
  isLoading,
  fileFilter,
  telegramIdFilter,
  usernameFilter,
  phoneFilter,
  onFileFilterChange,
  onTelegramIdFilterChange,
  onUsernameFilterChange,
  onPhoneFilterChange,
  onNextPage,
  onPreviousPage,
  canGoToNextPage,
  canGoToPreviousPage,
}: TelegramDlContactsTableProps) {
  return (
    <SectionCard
      title="Полная DL-база"
      description="Контакты из выгрузок DL с серверными фильтрами и постраничной загрузкой."
      className="border border-white/10 bg-slate-950/80 text-slate-100 shadow-soft-md backdrop-blur-2xl"
      headerClassName="border-white/10"
      contentClassName="space-y-4"
    >
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Input
          value={fileFilter}
          onChange={(event) => onFileFilterChange(event.target.value)}
          placeholder="Файл импорта"
          aria-label="Фильтр по файлу"
        />
        <Input
          value={telegramIdFilter}
          onChange={(event) => onTelegramIdFilterChange(event.target.value)}
          placeholder="telegramId"
          aria-label="Фильтр по telegramId"
        />
        <Input
          value={usernameFilter}
          onChange={(event) => onUsernameFilterChange(event.target.value)}
          placeholder="username"
          aria-label="Фильтр по username"
        />
        <Input
          value={phoneFilter}
          onChange={(event) => onPhoneFilterChange(event.target.value)}
          placeholder="phone"
          aria-label="Фильтр по phone"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="border-white/15 bg-white/5 text-slate-200">
            Показано: {contacts.length}
          </Badge>
          <Badge variant="outline" className="border-white/15 bg-white/5 text-slate-200">
            Всего: {total}
          </Badge>
          <Badge variant="outline" className="border-white/15 bg-white/5 text-slate-200">
            Страница: {pageIndex} / {pageCount}
          </Badge>
          <Badge variant="outline" className="border-white/15 bg-white/5 text-slate-200">
            Лимит: {pageSize}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onPreviousPage}
            disabled={!canGoToPreviousPage || isLoading}
            className="gap-2"
          >
            <ChevronLeft className="size-4" />
            Предыдущая страница
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onNextPage}
            disabled={!canGoToNextPage || isLoading}
            className="gap-2"
          >
            Следующая страница
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <LoadingState message="Загружаю контакты DL" />
      ) : contacts.length === 0 ? (
        <EmptyState
          variant="custom"
          title="Контакты не найдены"
          description="Проверь фильтры или дождись загрузки выгрузок DL."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead>Файл</TableHead>
              <TableHead>Контакт</TableHead>
              <TableHead>Идентификаторы</TableHead>
              <TableHead>Источник</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts.map((contact) => (
              <TableRow key={contact.id} className="border-white/10">
                <TableCell className="max-w-[280px] truncate text-slate-100">
                  {contact.originalFileName}
                </TableCell>
                <TableCell className="text-slate-200">
                  <div className="font-medium text-white">
                    {contact.fullName ??
                      [contact.firstName, contact.lastName].filter(Boolean).join(' ')}
                  </div>
                  <div className="text-xs text-slate-400">{contact.region ?? '—'}</div>
                </TableCell>
                <TableCell className="text-slate-200">
                  <div className="space-y-1">
                    <div>telegramId: {contact.telegramId ?? '—'}</div>
                    <div>username: {contact.username ?? '—'}</div>
                    <div>phone: {contact.phone ?? '—'}</div>
                  </div>
                </TableCell>
                <TableCell className="text-slate-300">#{contact.sourceRowIndex}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </SectionCard>
  )
}
