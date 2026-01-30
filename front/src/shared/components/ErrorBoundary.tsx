import React, { Component, type ReactNode } from 'react'
import { Button } from '@/shared/ui/button'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
    }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
          <div className="max-w-md rounded-lg border border-border bg-card p-6 shadow-lg">
            <h1 className="mb-4 text-2xl font-bold text-destructive">Произошла ошибка</h1>
            <p className="mb-4 text-muted-foreground">
              Приложение столкнулось с неожиданной ошибкой. Пожалуйста, попробуйте обновить
              страницу.
            </p>
            {this.state.error && (
              <details className="mb-4 rounded bg-muted p-3">
                <summary className="cursor-pointer text-sm font-medium">Детали ошибки</summary>
                <pre className="mt-2 overflow-auto text-xs">
                  {this.state.error.toString()}
                  {this.state.error.stack && (
                    <div className="mt-2 whitespace-pre-wrap">{this.state.error.stack}</div>
                  )}
                </pre>
              </details>
            )}
            <div className="flex gap-2">
              <Button onClick={this.handleReset} variant="default">
                Попробовать снова
              </Button>
              <Button onClick={() => window.location.reload()} variant="outline">
                Обновить страницу
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
