'use client'

import { useEffect } from 'react'

export default function HomeError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[home/error]', error.message, error.digest)
  }, [error])

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
          Error al cargar
        </p>
        <p className="text-sm mb-6 font-mono" style={{ color: 'rgba(255,255,255,0.35)' }}>
          {error.message}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-2.5 rounded-xl font-semibold text-sm"
            style={{ background: '#006A33', color: '#fff', border: 'none', cursor: 'pointer' }}
          >
            Reintentar
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-2.5 rounded-xl font-semibold text-sm"
            style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: 'none', cursor: 'pointer' }}
          >
            Volver al inicio
          </button>
        </div>
      </div>
    </div>
  )
}
