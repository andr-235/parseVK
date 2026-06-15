import { useState, useCallback, useEffect } from 'react'

export type Feedback = { type: 'success' | 'error'; text: string } | null

export function useFeedback(autoDismissMs = 3000) {
  const [feedback, setFeedback] = useState<Feedback>(null)

  const show = useCallback((type: 'success' | 'error', text: string) => {
    setFeedback({ type, text })
  }, [])

  const dismiss = useCallback(() => {
    setFeedback(null)
  }, [])

  useEffect(() => {
    if (!feedback) return
    const t = setTimeout(dismiss, autoDismissMs)
    return () => clearTimeout(t)
  }, [feedback, autoDismissMs, dismiss])

  return { feedback, showFeedback: show, dismissFeedback: dismiss }
}
