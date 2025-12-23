import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: React.ComponentType<ErrorFallbackProps>
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface ErrorFallbackProps {
  error: Error | null
  errorInfo: ErrorInfo | null
  resetError: () => void
}

const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetError }) => {
  const handleGoHome = () => {
    window.location.href = '/'
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>
        
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
          Something went wrong
        </h1>
        
        <p className="text-zinc-600 dark:text-zinc-400 mb-6">
          We encountered an unexpected error. This has been logged and we'll look into it.
        </p>

        {process.env.NODE_ENV === 'development' && error && (
          <details className="mb-6 text-left">
            <summary className="cursor-pointer text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Error Details (Development)
            </summary>
            <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-3 text-xs font-mono text-zinc-800 dark:text-zinc-200 overflow-auto max-h-32">
              <div className="text-red-600 dark:text-red-400 font-semibold mb-1">
                {error.name}: {error.message}
              </div>
              <div className="whitespace-pre-wrap text-zinc-600 dark:text-zinc-400">
                {error.stack}
              </div>
            </div>
          </details>
        )}

        <div className="flex gap-3 justify-center">
          <button
            onClick={resetError}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          
          <button
            onClick={handleGoHome}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium rounded-lg transition-colors"
          >
            <Home className="w-4 h-4" />
            Go Home
          </button>
        </div>
      </div>
    </div>
  )
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    })

    // Call the onError callback if provided
    this.props.onError?.(error, errorInfo)

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }

    // In production, you might want to log to an error reporting service
    // Example: logErrorToService(error, errorInfo)
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      
      return (
        <FallbackComponent
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          resetError={this.resetError}
        />
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary