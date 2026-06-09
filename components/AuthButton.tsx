'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogOut, ChevronDown } from 'lucide-react'
import type { User as SupabaseUser } from '@supabase/supabase-js'

type Profile = { avatar_url: string | null; username: string | null }

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

function MenuItem({
  onClick,
  icon,
  label,
  danger,
}: {
  onClick: () => void
  icon: React.ReactNode
  label: string
  danger?: boolean
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-left"
      style={{
        color: danger ? '#f87171' : 'var(--text-primary)',
        background: hovered ? 'var(--bg-option)' : 'transparent',
        transition: 'background 0.12s ease',
        border: 'none',
        cursor: 'pointer',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {icon}
      {label}
    </button>
  )
}

export default function AuthButton() {
  const [user,           setUser]           = useState<SupabaseUser | null>(null)
  const [profile,        setProfile]        = useState<Profile | null>(null)
  const [loading,        setLoading]        = useState(true)
  const [open,           setOpen]           = useState(false)
  const [avatarImgError, setAvatarImgError] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const supabase     = useRef(createClient()).current
  const router       = useRouter()

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('avatar_url, username').eq('id', userId).single()
    if (data) setProfile(data)
  }

  const upsertProfile = async (u: SupabaseUser) => {
    const meta = u.user_metadata
    await supabase.from('profiles').upsert({
      id:         u.id,
      email:      u.email ?? '',
      avatar_url: meta.avatar_url ?? meta.picture ?? null,
      username:   meta.full_name ?? meta.name ?? null,
    }, { onConflict: 'id' })
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      setUser(u); if (u) fetchProfile(u.id); setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_, session) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) { await upsertProfile(u); await fetchProfile(u.id) } else setProfile(null)
      setLoading(false)
    })
    const handleMsg = async (e: MessageEvent) => {
      if (e.data !== 'supabase:auth-complete') return
      const { data: { user: u } } = await supabase.auth.getUser()
      if (u) { setUser(u); await upsertProfile(u); await fetchProfile(u.id) }
    }
    window.addEventListener('message', handleMsg)
    return () => { subscription.unsubscribe(); window.removeEventListener('message', handleMsg) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback`, skipBrowserRedirect: true },
    })
    if (error || !data.url) return
    const w = 500, h = 600
    const left = Math.round(window.screenX + (window.outerWidth - w) / 2)
    const top  = Math.round(window.screenY + (window.outerHeight - h) / 2)
    window.open(data.url, 'google-auth', `width=${w},height=${h},left=${left},top=${top},toolbar=no,menubar=no`)
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null); setProfile(null); setOpen(false)
    router.push('/')
    router.refresh()
  }

  if (loading) {
    return <div className="h-8 w-8 rounded-full animate-pulse" style={{ background: 'var(--bg-option)', border: '1px solid var(--border-color)' }} />
  }

  if (user) {
    const avatarUrl   = profile?.avatar_url ?? user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? null
    const displayName = profile?.username ?? user.user_metadata?.full_name ?? user.email?.split('@')[0]

    return (
      <>
        <div ref={containerRef} className="relative">
          {/* Trigger */}
          <button
            onClick={() => setOpen(o => !o)}
            className="flex items-center gap-2 px-1.5 py-1 rounded-xl"
            style={{
              background:  open ? 'var(--bg-option)' : 'transparent',
              border:      open ? '1px solid var(--border-color)' : '1px solid transparent',
              transition: 'background 0.15s ease, border-color 0.15s ease',
            }}
          >
            <div className="relative shrink-0">
              {avatarUrl && !avatarImgError ? (
                <Image
                  src={avatarUrl} alt={displayName ?? 'Avatar'} width={32} height={32} unoptimized
                  className="h-8 w-8 rounded-full object-cover"
                  style={{ boxShadow: '0 0 0 2px rgba(167,139,250,0.35)' }}
                  onError={() => setAvatarImgError(true)}
                />
              ) : (
                <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: '#006A33' }}>
                  {displayName?.[0]?.toUpperCase()}
                </div>
              )}
              <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border-2" style={{ background: '#22c55e', borderColor: 'var(--dot-border)' }} />
            </div>
            <span className="text-sm font-medium hidden sm:block max-w-[90px] truncate" style={{ color: 'var(--text-primary)' }}>
              {displayName}
            </span>
            <ChevronDown className="h-3.5 w-3.5 hidden sm:block" style={{ color: 'var(--text-secondary)', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }} />
          </button>

          {/* Dropdown */}
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.14, ease: 'easeOut' }}
                className="absolute right-0 top-full mt-2 w-56 rounded-xl overflow-hidden z-50"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', boxShadow: '0 16px 48px rgba(0,0,0,0.22)', backdropFilter: 'blur(12px)' }}
              >
                {/* User info */}
                <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{displayName}</p>
                  <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-secondary)' }}>{user.email}</p>
                </div>

                <div className="border-t py-1.5" style={{ borderColor: 'var(--border-color)' }}>
                  <MenuItem
                    icon={<LogOut className="h-4 w-4 shrink-0" />}
                    label="Cerrar sesión"
                    onClick={signOut}
                    danger
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </>
    )
  }

  return (
    <motion.button
      onClick={signInWithGoogle}
      whileHover={{ scale: 1.04, boxShadow: '0 0 20px rgba(99,102,241,0.25)' }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
      style={{ background: 'var(--bg-sign-in)', border: '1px solid var(--border-sign-in)', backdropFilter: 'blur(10px)', color: 'var(--text-sign-in)' }}
    >
      <GoogleIcon />
      Iniciar con Google
    </motion.button>
  )
}
