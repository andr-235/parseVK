import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { listingsService } from '@/api/listings/listings.api'
import { Spinner } from '@/components/ui/spinner'
import { Upload, FileJson } from 'lucide-react'
import FileUpload from '@/components/common/FileUpload'

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

  if (!isOpen) return null

  const resolvedUploadSource = uploadSourceMode === 'custom' ? customSource : uploadSourceMode

  const handleImportFile = async (file: File) => {
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
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-slate-900/95 shadow-2xl backdrop-blur-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top glow line */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-slate-800/50">
              <Upload className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="font-monitoring-display text-xl font-semibold text-white">
                Импорт объявлений
              </h2>
              <p className="text-sm text-slate-400">Загрузка данных из JSON</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 transition-colors duration-200 hover:bg-white/5 hover:text-white"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="space-y-5 px-6 pb-6">
          {/* Source select */}
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wider text-slate-300">
              Источник данных
            </label>
            <select
              className="h-11 w-full appearance-none rounded-xl border border-white/10 bg-slate-800/50 px-3 text-sm text-white outline-none transition-all duration-200 focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/20"
              value={uploadSourceMode}
              onChange={(e) => setUploadSourceMode(e.target.value as 'avito' | 'youla' | 'custom')}
            >
              <option value="avito">Авито</option>
              <option value="youla">Юла</option>
              <option value="custom">Другое...</option>
            </select>
          </div>

          {uploadSourceMode === 'custom' && (
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wider text-slate-300">
                Название источника
              </label>
              <Input
                value={customSource}
                onChange={(e) => setCustomSource(e.target.value)}
                placeholder="Например, Циан"
                className="h-11 border-white/10 bg-slate-800/50 text-white placeholder:text-slate-500 transition-all duration-200 focus:border-cyan-400/50 focus:ring-cyan-400/20"
              />
            </div>
          )}

          {/* Update existing checkbox */}
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-slate-800/30 p-3 transition-colors duration-200 hover:bg-white/5">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-white/20 bg-slate-800 text-cyan-500 focus:ring-cyan-400/20"
              checked={updateExisting}
              onChange={(e) => setUpdateExisting(e.target.checked)}
            />
            <span className="text-sm text-slate-300">Обновлять существующие записи</span>
          </label>

          {/* Info block */}
          <div className="flex gap-3 rounded-xl border border-white/10 bg-slate-800/30 p-4">
            <FileJson className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />
            <p className="text-xs leading-relaxed text-slate-400">
              Поддерживаются JSON-файлы, содержащие массив объявлений или объект с полем{' '}
              <code className="font-mono-accent font-bold text-cyan-400">listings</code>.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="animate-in slide-in-from-top-2 fade-in-0 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              <span className="font-mono-accent">⚠</span> {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={isUploading}
              className="h-11 text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
            >
              Отмена
            </Button>
            <FileUpload
              accept="application/json,.json"
              onFilesSelect={([file]) => handleImportFile(file)}
              disabled={isUploading}
              isLoading={isUploading}
              buttonText={isUploading ? 'Загрузка...' : 'Выбрать файл'}
              buttonClassName="group relative h-11 overflow-hidden bg-gradient-to-r from-cyan-500 to-blue-500 font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-cyan-500/40 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              uploadIcon={isUploading ? <Spinner className="size-4" /> : <></>}
            />
          </div>
        </div>

        {/* Bottom accent line */}
        <div className="h-px bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500" />
      </div>
    </div>
  )
}

export default ImportListingsModal
