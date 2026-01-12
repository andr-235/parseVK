import {
  forwardRef,
  useCallback,
  useId,
  useImperativeHandle,
  useRef,
  useState,
  type ChangeEvent,
} from 'react'
import { Upload } from 'lucide-react'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { cn } from '@/lib/utils'
import type { FileUploadProps, FileUploadRef } from '@/types/fileUpload'
import { validateFiles } from '@/utils/fileValidation'

const FileUpload = forwardRef<FileUploadRef, FileUploadProps>(function FileUpload(
  {
    onUpload,
    onFilesSelect,
    accept = '.txt,text/plain',
    multiple = false,
    maxSizeBytes,
    autoReset = true,
    disabled = false,
    isLoading = false,
    id,
    name,
    className,
    buttonText = 'Загрузить из файла',
    buttonVariant = 'outline',
    buttonSize = 'default',
    buttonClassName,
    uploadIcon,
    variant = 'button',
    dropzoneText = 'Перетащите файл сюда или нажмите для выбора',
    'aria-label': ariaLabel,
  },
  ref
) {
  const generatedId = useId()
  const inputId = id ?? `file-upload-${generatedId}`
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const reset = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  const open = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  useImperativeHandle(ref, () => ({ open, reset }), [open, reset])

  // Единая обработка выбранных/брошенных файлов (DRY)
  const handleFiles = useCallback(
    async (files: File[]) => {
      const { valid } = validateFiles(files, accept, maxSizeBytes)
      if (valid.length === 0) return
      if (onFilesSelect) {
        await onFilesSelect(valid)
      }
    },
    [accept, maxSizeBytes, onFilesSelect]
  )

  const handleInputChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const list = event.target.files
      if (!list || list.length === 0) {
        if (autoReset) reset()
        return
      }
      // Совместимость: сначала исходный onUpload
      if (onUpload) await onUpload(event)
      // Предпочтительный путь
      await handleFiles(Array.from(list))
      if (autoReset) reset()
    },
    [autoReset, handleFiles, onUpload, reset]
  )

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      if (!disabled) setIsDragOver(true)
    },
    [disabled]
  )

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      if (disabled) return
      const files = Array.from(e.dataTransfer.files || [])
      if (files.length === 0) return
      await handleFiles(multiple ? files : [files[0]])
    },
    [handleFiles, disabled, multiple]
  )

  return (
    <div className={className}>
      <Input
        ref={fileInputRef}
        id={inputId}
        name={name}
        type="file"
        className="sr-only"
        accept={accept}
        multiple={multiple}
        onChange={handleInputChange}
        aria-hidden
        tabIndex={-1}
        disabled={disabled}
      />

      {variant === 'dropzone' ? (
        <div
          role="button"
          tabIndex={0}
          aria-label={ariaLabel ?? buttonText}
          aria-disabled={disabled || isLoading}
          onClick={open}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              open()
            }
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            'group relative grid cursor-pointer place-items-center rounded-xl border border-dashed p-4',
            'transition-colors text-text-secondary hover:text-text-primary',
            isDragOver
              ? 'border-accent-primary/70 bg-accent-primary/10'
              : 'border-border/60 bg-background-primary/40 hover:border-accent-primary/60',
            disabled && 'cursor-not-allowed opacity-60'
          )}
        >
          <div className="pointer-events-none flex flex-col items-center gap-2 text-center">
            {uploadIcon ?? <Upload className="size-6 opacity-80" />}
            <span className="text-sm">{dropzoneText}</span>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          onClick={open}
          variant={buttonVariant}
          size={buttonSize}
          className={['w-full sm:w-auto', buttonClassName ?? ''].join(' ')}
          disabled={disabled || isLoading}
          aria-label={ariaLabel ?? buttonText}
          aria-busy={isLoading}
        >
          {uploadIcon ?? <Upload className="mr-2 size-4" />}
          {buttonText}
        </Button>
      )}
    </div>
  )
})

export default FileUpload
