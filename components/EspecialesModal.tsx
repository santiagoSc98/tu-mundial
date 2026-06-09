'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { X, Trophy } from 'lucide-react'
import EspecialesView from '@/components/EspecialesView'
import type { SpecialPrediction } from '@/components/EspecialesView'

interface Props {
  userId: string | null
  /** Controlled mode: pass open state from parent (AuthButton dropdown) */
  externalOpen?: boolean
  onExternalClose?: () => void
}

export default function EspecialesModal({ userId, externalOpen, onExternalClose }: Props) {
  const isControlled = externalOpen !== undefined

  const [internalOpen, setInternalOpen] = useState(false)
  const [mounted,   setMounted]   = useState(false)
  const [existing,  setExisting]  = useState<SpecialPrediction | null>(null)
  const [loaded,    setLoaded]    = useState(false)
  const supabase = useRef(createClient()).current

  const open = isControlled ? externalOpen! : internalOpen

  useEffect(() => { setMounted(true) }, [])

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Fetch data when controlled parent opens the modal
  useEffect(() => {
    if (externalOpen && !loaded && userId) {
      loadData()
    }
  }, [externalOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadData = async () => {
    if (!userId || loaded) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from('special_predictions')
      .select('champion_team, top_scorer')
      .eq('user_id', userId)
      .single()
    setExisting(data ?? null)
    setLoaded(true)
  }

  const handleOpen = async () => {
    setInternalOpen(true)
    await loadData()
  }

  const handleClose = () => {
    if (isControlled) onExternalClose?.()
    else setInternalOpen(false)
  }

  const modal = (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', zIndex: 1000 }}
          />
          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            style={{ position: 'fixed', inset: 0, zIndex: 1001, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', pointerEvents: 'none' }}
          >
            <div style={{ width: '100%', maxWidth: 600, maxHeight: '92dvh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)', borderRadius: '1.5rem 1.5rem 0 0', overflow: 'hidden', pointerEvents: 'auto', boxShadow: '0 -8px 40px rgba(0,0,0,0.40)' }}>
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ background: 'var(--mundial-header-bg)', borderBottom: '1px solid var(--mundial-header-border)' }}>
                <div className="flex items-center gap-2.5">
                  <Trophy className="h-5 w-5 shrink-0" style={{ color: 'var(--secondary)' }} />
                  <div>
                    <p className="text-sm font-black tracking-wider" style={{ color: '#fff' }}>
                      PREDICCIONES ESPECIALES
                    </p>
                    <p className="text-xs" style={{ color: 'var(--mundial-muted)' }}>Mundial 2026 · hasta 24 pts</p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="flex items-center justify-center h-8 w-8 rounded-lg"
                  style={{ background: 'var(--mundial-option-bg)', border: '1px solid var(--mundial-option-border)', color: 'var(--mundial-muted)', cursor: 'pointer' }}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {/* Body */}
              <div className="flex-1 overflow-y-auto px-4 py-5" style={{ scrollbarWidth: 'thin', background: 'var(--page-bg-home)' }}>
                <EspecialesView userId={userId} existing={existing} compact onSave={handleClose} />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )

  // Controlled mode: no trigger button, just the portal
  if (isControlled) {
    return mounted ? createPortal(modal, document.body) : null
  }

  // Self-contained mode: trigger button + portal
  return (
    <>
      <button
        onClick={handleOpen}
        className="w-full flex items-center justify-between gap-3 rounded-2xl px-5 py-3.5 mb-6 text-left"
        style={{ background: 'rgba(0,106,51,0.08)', border: '1px solid rgba(0,106,51,0.20)', backdropFilter: 'blur(12px)', cursor: 'pointer', transition: 'border-color 0.15s, background 0.15s' }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,106,51,0.38)'; (e.currentTarget as HTMLElement).style.background = 'rgba(0,106,51,0.14)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,106,51,0.20)'; (e.currentTarget as HTMLElement).style.background = 'rgba(0,106,51,0.08)' }}
      >
        <div className="flex items-center gap-3">
          <Trophy className="h-5 w-5 shrink-0" style={{ color: 'var(--secondary)' }} />
          <div>
            <p className="text-sm font-bold" style={{ color: 'var(--secondary)', letterSpacing: '0.02em' }}>Predicciones Especiales</p>
            <p className="text-xs" style={{ color: 'var(--mundial-muted)' }}>Campeón · Goleador · 24 pts</p>
          </div>
        </div>
        <span className="text-sm font-semibold" style={{ color: 'rgba(0,106,51,0.70)' }}>→</span>
      </button>
      {mounted && createPortal(modal, document.body)}
    </>
  )
}
