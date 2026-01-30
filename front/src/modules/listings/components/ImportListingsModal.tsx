import { useState, useRef, type ChangeEvent } from 'react'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
// Использование services для одноразовой операции (импорт данных)
// Это допустимо согласно правилам архитектуры для операций, не требующих состояния
import { listingsService } from '@/modules/listings/api/listings.api'
import { Spinner } from '@/shared/ui/spinner'
import { Upload, AlertCircle, FileJson } from 'lucide-react'

interface ImportListingsModalProps {
  isOpen: boolean
  onClose: () => void
  onImportComplete: () => void
}

function ImportListingsModal({ isOpen, onClose, onImportComplete }: ImportListingsModalProps) {
  const [uploadSourceMode, setUploadSourceMode] = useState<'avito' | 'youla' | 'custom'>('avito')
  const [customSource, setCustomSource] = useState('')
  const [updateExisting, setUpdateExisting] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const resolvedUploadSource = uploadSourceMode === 'custom' ? customSource : uploadSourceMode

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setError(null)
    try {
      await listingsService.importFromJson({
        file,
        source: resolvedUploadSource,
        updateExisting,
      })
      onImportComplete()
      onClose()
    } catch (err) {
      console.error(err)
      setError('Не удалось импортировать объявления. Проверьте формат файла.')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleUploadClick = () => {
    if (isUploading) return
    fileInputRef.current?.click()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl bg-background-secondary border border-border shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-primary/10 text-accent-primary">
              <Upload className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-text-primary">Импорт объявлений</h2>
              <p className="text-sm text-text-secondary">Загрузка данных из JSON</p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary">Источник данных</label>
              <select
                className="w-full appearance-none rounded-lg border border-border bg-background-primary px-3 py-2 text-sm text-text-primary outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary"
                value={uploadSourceMode}
                onChange={(e) =>
                  setUploadSourceMode(e.target.value as 'avito' | 'youla' | 'custom')
                }
              >
                <option value="avito">Авито</option>
                <option value="youla">Юла</option>
                <option value="custom">Другое...</option>
              </select>
            </div>

            {uploadSourceMode === 'custom' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-primary">Название источника</label>
                <Input
                  value={customSource}
                  onChange={(e) => setCustomSource(e.target.value)}
                  placeholder="Например, Циан"
                  className="bg-background-primary"
                />
              </div>
            )}

            <label className="flex items-center gap-2 rounded-lg border border-border/60 p-3 hover:bg-background-primary/50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-border text-accent-primary focus:ring-accent-primary bg-background-primary"
                checked={updateExisting}
                onChange={(e) => setUpdateExisting(e.target.checked)}
              />
              <span className="text-sm text-text-primary">Обновлять существующие записи</span>
            </label>

            <div className="rounded-lg bg-accent-primary/5 p-4 border border-accent-primary/10">
              <div className="flex gap-2 text-xs text-text-secondary leading-relaxed">
                <FileJson className="h-4 w-4 shrink-0 text-accent-primary mt-0.5" />
                <p>
                  Поддерживаются JSON-файлы, содержащие массив объявлений или объект с полем{' '}
                  <code className="font-mono font-bold">listings</code>.
                </p>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-border bg-background-primary/50 p-4">
          <Button variant="ghost" onClick={onClose} disabled={isUploading}>
            Отмена
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button onClick={handleUploadClick} disabled={isUploading}>
            {isUploading ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Загрузка...
              </>
            ) : (
              'Выбрать файл'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ImportListingsModal
