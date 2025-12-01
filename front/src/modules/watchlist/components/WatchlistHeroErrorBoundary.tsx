import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

/**
 * Error boundary для обработки ошибок рендеринга компонента WatchlistHero
 */
class WatchlistHeroErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('WatchlistHero Error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 border border-red-300 rounded-md bg-red-50">
          <h3 className="text-red-800 font-medium">Ошибка отображения компонента</h3>
          <p className="text-red-600 text-sm mt-1">
            Произошла ошибка при загрузке настроек watchlist. Попробуйте перезагрузить страницу.
          </p>
        </div>
      )
    }

    return this.props.children
  }
}

export default WatchlistHeroErrorBoundary

