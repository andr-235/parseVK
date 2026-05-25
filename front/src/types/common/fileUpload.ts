import type { ChangeEvent, ReactNode } from 'react'

export type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon' | 'icon-sm' | 'icon-lg'

/**
 * Публичный ref API для программного управления компонентом загрузки файлов.
 */
export interface FileUploadRef {
  /** Открыть системный диалог выбора файла */
  open: () => void
  /** Очистить выбранные файлы в скрытом input */
  reset: () => void
}

/**
 * Пропсы для компонента FileUpload.
 */
export interface FileUploadProps {
  /** Старый API — исходный change-событие input; сохранён для совместимости */
  onUpload?: (event: ChangeEvent<HTMLInputElement>) => void | Promise<void>
  /** Предпочтительный API — список выбранных/брошенных файлов */
  onFilesSelect?: (files: File[]) => void | Promise<void>
  /** Список допустимых типов, например ".txt,text/plain,image/*" */
  accept?: string
  multiple?: boolean
  /** Максимальный размер файла в байтах */
  maxSizeBytes?: number
  /** Очищать ли input после обработки */
  autoReset?: boolean
  disabled?: boolean
  isLoading?: boolean
  id?: string
  name?: string
  className?: string
  buttonText?: string
  buttonVariant?: ButtonVariant
  buttonSize?: ButtonSize
  buttonClassName?: string
  uploadIcon?: ReactNode
  /** Режим отображения */
  variant?: 'button' | 'dropzone'
  dropzoneText?: string
  'aria-label'?: string
}
