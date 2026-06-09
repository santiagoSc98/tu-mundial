'use client'

import { createClient } from '@/lib/supabase/client'

export default function LandingPage() {
  const handleLogin = async () => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ background: '#010b1f' }}
    >
      <div className="flex flex-col items-center text-center gap-8">
        <img
          src="/logo-mundial.png"
          alt="Mundial 2026"
          style={{ width: 140, height: 140, objectFit: 'contain' }}
        />

        <div className="space-y-1">
          <h1
            className="text-5xl font-bold"
            style={{ fontFamily: 'var(--font-montserrat, system-ui)', color: '#fff', letterSpacing: '-0.02em' }}
          >
            TU MUNDIAL
          </h1>
          <p className="text-2xl font-bold" style={{ color: '#006A33' }}>
            Tus Predicciones
          </p>
        </div>

        <p className="text-xl" style={{ color: '#9CA3AF' }}>
          Predice. Compite. Gana.
        </p>

        <button
          onClick={handleLogin}
          style={{
            background: '#0052A5',
            color: '#fff',
            padding: '16px 40px',
            borderRadius: 16,
            fontSize: 17,
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(0,82,165,0.35)',
          }}
        >
          Entrar con Google
        </button>

        <p className="text-sm" style={{ color: '#6B7280' }}>
          Gratis · Sin descargas
        </p>
      </div>
    </div>
  )
}
