'use client'

import React from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    // You can log the error to an error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.setState({
      error: error,
      errorInfo: errorInfo
    })
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-50 p-4">
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>

            <h1 className="text-2xl font-bold text-gray-800 mb-3">Oops! Something went wrong</h1>
            <p className="text-gray-600 mb-6">
              We encountered an unexpected error. Don&apos;t worry, we&apos;re working to fix it!
            </p>

            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh Page</span>
              </button>

              <button
                onClick={() => window.location.href = '/'}
                className="w-full flex items-center justify-center space-x-2 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Home className="w-4 h-4" />
                <span>Go Home</span>
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg text-left">
                <h3 className="font-medium text-gray-800 mb-2">Error Details:</h3>
                <pre className="text-xs text-gray-600 overflow-auto">
                  {this.state.error.toString()}
                  {this.state.errorInfo.componentStack}
                </pre>
              </div>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
