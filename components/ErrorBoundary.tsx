'use client'

import { Component, type ReactNode } from 'react'

interface Props  { children: ReactNode }
interface State  { hasError: boolean; error?: Error }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('[ErrorBoundary] capturado:', error.message, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-screen flex items-center justify-center p-8"
          style={{ background: '#07111F' }}
        >
          <div
            className="rounded-2xl p-8 w-full max-w-md text-center"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.30)' }}
          >
            <p className="text-lg font-bold mb-2" style={{ color: '#f87171' }}>
              Algo salió mal
            </p>
            <p className="text-sm mb-6 font-mono" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {this.state.error?.message ?? 'Error desconocido'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 rounded-xl font-semibold text-sm"
              style={{ background: '#006A33', color: '#fff', border: 'none', cursor: 'pointer' }}
            >
              Recargar página
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
