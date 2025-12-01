import { useCallback } from 'react'
import { useWatchlistStore } from '@/store'

export const useWatchlistSettings = () => {
  const settings = useWatchlistStore((state) => state.settings)
  const updateSettings = useWatchlistStore((state) => state.updateSettings)
  const isUpdatingSettings = useWatchlistStore((state) => state.isUpdatingSettings)

  const handleToggleTrackAll = useCallback(() => {
    if (!settings) {
      return
    }

    const toggle = async () => {
      try {
        await updateSettings({ trackAllComments: !settings.trackAllComments })
      } catch (error) {
        console.error('Не удалось изменить настройку мониторинга', error)
      }
    }

    void toggle()
  }, [settings, updateSettings])

  return {
    settings,
    isUpdatingSettings,
    handleToggleTrackAll,
  }
}