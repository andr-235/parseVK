import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table'
import { Badge } from '@/shared/ui/badge'
import type { TelegramMember, TelegramSyncResponse } from '@/types/api'
import { Users, Shield, UserX, Ban, CheckCircle2, Star } from 'lucide-react'
import { getChatTypeInfo } from '@/modules/telegram/utils/telegramChatType.utils'

interface TelegramMembersCardProps {
  data: TelegramSyncResponse | null
}

export default function TelegramMembersCard({ data }: TelegramMembersCardProps) {
  const members = useMemo(() => data?.members ?? [], [data?.members])

  const formatMemberName = (member: TelegramMember) => {
    const parts = [member.firstName, member.lastName].filter((value) =>
      Boolean(value && value.trim().length > 0)
    )
    if (parts.length > 0) {
      return parts.join(' ')
    }
    if (member.username) {
      return `@${member.username}`
    }
    return member.telegramId
  }

  const formatDate = (value: string | null) => {
    if (!value) return '—'
    try {
      return new Intl.DateTimeFormat('ru-RU', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(value))
    } catch {
      return value
    }
  }

  const formatStatus = (status: TelegramMember['status']) => {
    const map: Record<TelegramMember['status'], string> = {
      CREATOR: 'Создатель',
      ADMINISTRATOR: 'Администратор',
      MEMBER: 'Участник',
      RESTRICTED: 'Ограничен',
      LEFT: 'Покинул',
      KICKED: 'Исключён',
    }
    return map[status] ?? status
  }

  const statusVariant = (status: TelegramMember['status']) => {
    if (status === 'CREATOR') return 'default'
    if (status === 'ADMINISTRATOR') return 'secondary'
    if (status === 'RESTRICTED') return 'outline'
    if (status === 'LEFT' || status === 'KICKED') return 'destructive'
    return 'outline'
  }

  const typeInfo = useMemo(() => {
    if (!data?.type) return null
    return getChatTypeInfo(data.type)
  }, [data?.type])

  if (!data) {
    return (
      <Card className="h-full border-dashed">
        <CardContent className="flex flex-col items-center justify-center h-[300px] text-center">
          <Users className="h-12 w-12 text-muted-foreground/20 mb-4" />
          <h3 className="font-medium text-lg text-muted-foreground">Нет данных</h3>
          <p className="text-sm text-muted-foreground/60 max-w-xs">
            Выполните синхронизацию, чтобы увидеть список участников
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CardTitle>Участники</CardTitle>
              {typeInfo && (
                <Badge variant="outline" className="flex items-center gap-1.5">
                  {(() => {
                    const Icon = typeInfo.icon
                    return <Icon className={`h-3.5 w-3.5 ${typeInfo.color}`} />
                  })()}
                  <span>{typeInfo.label}</span>
                </Badge>
              )}
            </div>
            <CardDescription>
              Найдено {members.length} участников
              {data?.title && ` • ${data.title}`}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">Участник</TableHead>
                <TableHead className="w-[150px]">Статус</TableHead>
                <TableHead>Контакты</TableHead>
                <TableHead>Флаги</TableHead>
                <TableHead className="w-[150px]">Активность</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    Участники не найдены
                  </TableCell>
                </TableRow>
              ) : (
                members.map((member) => {
                  const flags = []
                  if (member.verified)
                    flags.push({
                      icon: <CheckCircle2 className="h-3 w-3" />,
                      title: 'Верифицирован',
                      variant: 'default' as const,
                    })
                  if (member.scam)
                    flags.push({
                      icon: <Shield className="h-3 w-3" />,
                      title: 'Scam',
                      variant: 'destructive' as const,
                    })
                  if (member.fake)
                    flags.push({
                      icon: <UserX className="h-3 w-3" />,
                      title: 'Fake',
                      variant: 'outline' as const,
                    })
                  if (member.deleted)
                    flags.push({
                      icon: <Ban className="h-3 w-3" />,
                      title: 'Удален',
                      variant: 'secondary' as const,
                    })
                  if (member.isPremium)
                    flags.push({
                      icon: <Star className="h-3 w-3" />,
                      title: 'Premium',
                      variant: 'default' as const,
                    })

                  return (
                    <TableRow key={`${member.userId}-${member.telegramId}`}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{formatMemberName(member)}</span>
                          <span className="text-xs text-muted-foreground">
                            ID: {member.telegramId}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 flex-wrap">
                          <Badge variant={statusVariant(member.status)} className="text-xs">
                            {formatStatus(member.status)}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col text-sm">
                          {member.username ? (
                            <span className="text-primary hover:underline cursor-pointer">
                              @{member.username}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                          {member.phoneNumber && (
                            <span className="text-xs text-muted-foreground">
                              {member.phoneNumber}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {flags.map((flag, i) => (
                            <Badge
                              key={i}
                              variant={flag.variant}
                              className="h-5 w-5 p-0 flex items-center justify-center rounded-full"
                              title={flag.title}
                            >
                              {flag.icon}
                            </Badge>
                          ))}
                          {flags.length === 0 && (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col text-xs text-muted-foreground">
                          <span>Вход: {formatDate(member.joinedAt)}</span>
                          {member.leftAt && <span>Выход: {formatDate(member.leftAt)}</span>}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
