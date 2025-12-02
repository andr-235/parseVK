import { useCallback, useEffect, useRef, useState } from 'react'
import { useTaskAutomationStore } from '@/store'
import { clamp, formatAutomationTime } from '@/modules/settings/utils/automationFormatting'

interface AutomationFormState {
  enabled: boolean
  time: string
  postLimit: number
}

const DEFAULT_TIME = '03:00'
const MIN_POST_LIMIT = 1
const MAX_POST_LIMIT = 100

export const useAutomationSettings = () => {
  const settings = useTaskAutomationStore((state) => state.settings)
  const fetchSettings = useTaskAutomationStore((state) => state.fetchSettings)
  const updateSettings = useTaskAutomationStore((state) => state.updateSettings)
  const runNow = useTaskAutomationStore((state) => state.runNow)
  const isLoading = useTaskAutomationStore((state) => state.isLoading)
  const isUpdating = useTaskAutomationStore((state) => state.isUpdating)
  const isTriggering = useTaskAutomationStore((state) => state.isTriggering)

  const [formState, setFormState] = useState<AutomationFormState>({
    enabled: false,
    time: DEFAULT_TIME,
    postLimit: 10,
  })

  const fetchSettingsRef = useRef(fetchSettings)
  fetchSettingsRef.current = fetchSettings

  useEffect(() => {
    if (!settings && !isLoading) {
      void fetchSettingsRef.current()
    }
  }, [settings, isLoading])

  useEffect(() => {
    if (!settings) {
      return
    }

    const newTime = formatAutomationTime(settings.runHour, settings.runMinute)
    setFormState((prev) => {
      if (
        prev.enabled === settings.enabled &&
        prev.time === newTime &&
        prev.postLimit === settings.postLimit
      ) {
        return prev
      }
      return {
        enabled: settings.enabled,
        time: newTime,
        postLimit: settings.postLimit,
      }
    })
  }, [settings?.enabled, settings?.runHour, settings?.runMinute, settings?.postLimit])

  const isFormDisabled = !settings || isUpdating

  const handleToggle = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setFormState((prev) => ({
      ...prev,
      enabled: event.target.checked,
    }))
  }, [])

  const handleTimeChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setFormState((prev) => ({
      ...prev,
      time: event.target.value,
    }))
  }, [])

  const handlePostLimitChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = Number.parseInt(event.target.value, 10)
    setFormState((prev) => ({
      ...prev,
      postLimit: Number.isFinite(parsed)
        ? clamp(parsed, MIN_POST_LIMIT, MAX_POST_LIMIT)
        : prev.postLimit,
    }))
  }, [])

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      if (!settings) {
        return
      }

      const [hoursString, minutesString] = formState.time.split(':')
      const runHour = clamp(Number.parseInt(hoursString ?? '0', 10), 0, 23)
      const runMinute = clamp(Number.parseInt(minutesString ?? '0', 10), 0, 59)

      await updateSettings({
        enabled: formState.enabled,
        runHour,
        runMinute,
        postLimit: formState.postLimit,
        timezoneOffsetMinutes: new Date().getTimezoneOffset(),
      })
    },
    [formState, settings, updateSettings]
  )

  const handleRunNow = useCallback(async () => {
    await runNow()
  }, [runNow])

  return {
    settings,
    formState,
    isFormDisabled,
    isUpdating,
    isTriggering,
    isLoading,
    handleToggle,
    handleTimeChange,
    handlePostLimitChange,
    handleSubmit,
    handleRunNow,
  }
}
