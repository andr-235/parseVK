import { useState } from 'react'
import { Input } from '@/shared/ui/input'
import { Badge } from '@/shared/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table'
import SectionCard from '@/shared/components/SectionCard'
import { EmptyState } from '@/shared/components/EmptyState'
import { LoadingState } from '@/shared/components/LoadingState'
import type { TelegramDlImportContact } from '@/modules/telegram-dl-upload/api/telegramDlUpload.api'

interface TelegramDlContactsTableProps {
  contacts: TelegramDlImportContact[]
  isLoading: boolean
}

const matchesText = (value: string | null | undefined, filter: string) => {
  if (!filter.trim()) {
    return true
  }

  return (value ?? '').toLowerCase().includes(filter.trim().toLowerCase())
}

export default function TelegramDlContactsTable({
  contacts,
  isLoading,
}: TelegramDlContactsTableProps) {
  const [fileFilter, setFileFilter] = useState('')
  const [telegramIdFilter, setTelegramIdFilter] = useState('')
  const [usernameFilter, setUsernameFilter] = useState('')
  const [phoneFilter, setPhoneFilter] = useState('')

  const visibleContacts = contacts.filter(
    (contact) =>
      matchesText(contact.originalFileName, fileFilter) &&
      matchesText(contact.telegramId, telegramIdFilter) &&
      matchesText(contact.username, usernameFilter) &&
      matchesText(contact.phone, phoneFilter)
  )

  return (
    <SectionCard
      title="Полная DL-база"
      description="Все контакты из выгрузок DL с базовыми фильтрами по файлу и идентификаторам."
      className="border border-white/10 bg-slate-950/80 text-slate-100 shadow-soft-md backdrop-blur-2xl"
      headerClassName="border-white/10"
      contentClassName="space-y-4"
    >
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Input
          value={fileFilter}
          onChange={(event) => setFileFilter(event.target.value)}
          placeholder="Файл импорта"
          aria-label="Фильтр по файлу"
        />
        <Input
          value={telegramIdFilter}
          onChange={(event) => setTelegramIdFilter(event.target.value)}
          placeholder="telegramId"
          aria-label="Фильтр по telegramId"
        />
        <Input
          value={usernameFilter}
          onChange={(event) => setUsernameFilter(event.target.value)}
          placeholder="username"
          aria-label="Фильтр по username"
        />
        <Input
          value={phoneFilter}
          onChange={(event) => setPhoneFilter(event.target.value)}
          placeholder="phone"
          aria-label="Фильтр по phone"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className="border-white/15 bg-white/5 text-slate-200">
          Показано: {visibleContacts.length}
        </Badge>
        <Badge variant="outline" className="border-white/15 bg-white/5 text-slate-200">
          Всего: {contacts.length}
        </Badge>
      </div>

      {isLoading ? (
        <LoadingState message="Загружаю контакты DL" />
      ) : visibleContacts.length === 0 ? (
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
            {visibleContacts.map((contact) => (
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
