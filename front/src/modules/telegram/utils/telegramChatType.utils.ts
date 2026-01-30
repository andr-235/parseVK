import { Hash, Users, User, MessageSquare } from 'lucide-react'
import type { TelegramChatType } from '@/shared/types'

export interface TelegramChatTypeInfo {
  label: string
  icon: typeof Hash
  description: string
  color: string
}

export const TELEGRAM_CHAT_TYPE_INFO: Record<TelegramChatType, TelegramChatTypeInfo> = {
  CHANNEL: {
    label: 'Канал',
    icon: Hash,
    description: 'Публичный или приватный канал',
    color: 'text-blue-500',
  },
  SUPERGROUP: {
    label: 'Супергруппа',
    icon: Users,
    description: 'Группа с расширенными возможностями',
    color: 'text-green-500',
  },
  GROUP: {
    label: 'Группа',
    icon: MessageSquare,
    description: 'Обычная группа',
    color: 'text-purple-500',
  },
  PRIVATE: {
    label: 'Пользователь',
    icon: User,
    description: 'Личный чат с пользователем',
    color: 'text-orange-500',
  },
}

export function getChatTypeInfo(type: TelegramChatType): TelegramChatTypeInfo {
  return (
    TELEGRAM_CHAT_TYPE_INFO[type] ?? {
      label: type,
      icon: Hash,
      description: 'Неизвестный тип',
      color: 'text-muted-foreground',
    }
  )
}

export function formatChatType(type: TelegramChatType): string {
  return getChatTypeInfo(type).label
}
