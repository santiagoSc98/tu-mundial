'use client'

import { useRef } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" style={{ width: 18, height: 18, flexShrink: 0 }}>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

export default function LoginScreen() {
  const supabase = useRef(createClient()).current

  const signIn = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback`, skipBrowserRedirect: true },
    })
    if (error || !data.url) return
    const w = 500, h = 600
    const left = Math.round(window.screenX + (window.outerWidth  - w) / 2)
    const top  = Math.round(window.screenY + (window.outerHeight - h) / 2)
    window.open(data.url, 'google-auth', `width=${w},height=${h},left=${left},top=${top},toolbar=no,menubar=no`)
  }

  return (
    <div
      className="flex flex-col items-center justify-center"
      style={{ height: '100dvh', background: 'var(--navy, #0B132B)' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="flex flex-col items-center gap-8"
      >
        {/* Logo */}
        <div className="flex flex-col items-center gap-4">
          <img src="/logo-mundial.png" alt="Mundial 2026" style={{ width: 120, height: 120, objectFit: 'contain' }} />
          <h1
            className="text-5xl font-black text-center"
            style={{
              fontFamily: 'var(--font-montserrat, system-ui)',
              color: '#fff',
              letterSpacing: '-0.02em',
            }}
          >
            TU MUNDIAL
          </h1>
          <p className="text-sm font-semibold tracking-widest" style={{ color: 'rgba(255,255,255,0.40)', letterSpacing: '0.10em' }}>
            Tus Predicciones
          </p>
          <p className="text-xs mt-1 tracking-widest" style={{ color: 'rgba(255,255,255,0.20)' }}>
            MUNDIAL 2026
          </p>
        </div>

        {/* Sign in */}
        <div className="flex flex-col items-center gap-3">
          <motion.button
            onClick={signIn}
            whileHover={{ scale: 1.04, boxShadow: '0 8px 32px rgba(99,102,241,0.45)' }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-3 px-7 py-3.5 rounded-xl text-sm font-bold"
            style={{
              background: '#0052A5',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(0,82,165,0.35)',
            }}
          >
            <GoogleIcon />
            Entrar con Google
          </motion.button>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.20)' }}>
            Gratis · Sin descargas
          </p>
        </div>
      </motion.div>
    </div>
  )
}
