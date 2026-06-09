'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Check, AlertCircle, Loader2, ArrowLeft, Trophy, Target, Star } from 'lucide-react'
import Link from 'next/link'
import { getFlagUrl } from '@/lib/flagCodes'
import TeamDropdown from '@/components/TeamDropdown'
import ScorerCombobox from '@/components/ScorerCombobox'

export type SpecialPrediction = {
  champion_team: string | null
  top_scorer: string | null
}

interface Props {
  userId: string | null
  existing: SpecialPrediction | null
  compact?: boolean
  onSave?: () => void
}

export default function EspecialesView({ userId, existing, compact = false, onSave }: Props) {
  const [championTla,  setChampionTla]  = useState<string | null>(null)
  const [championName, setChampionName] = useState<string | null>(existing?.champion_team ?? null)
  const [topScorer,    setTopScorer]    = useState(existing?.top_scorer ?? '')
  const [saving,       setSaving]       = useState(false)
  const [savedOk,      setSavedOk]      = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string; visible: boolean }>({
    type: 'success', message: '', visible: false,
  })
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const supabase = useRef(createClient()).current

  const showToast = (type: 'success' | 'error', message: string) => {
    clearTimeout(toastTimer.current)
    setToast({ type, message, visible: true })
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, visible: false })), 3500)
  }

  const handleSave = async () => {
    if (!userId) { showToast('error', 'Iniciá sesión para guardar'); return }
    if (!championTla && !topScorer.trim()) {
      showToast('error', 'Completá al menos una predicción')
      return
    }
    setSaving(true)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('special_predictions')
        .upsert({
          user_id: userId,
          champion_team: championName ?? null,
          top_scorer: topScorer.trim() || null,
        }, { onConflict: 'user_id' })
      if (error) throw error
      setSavedOk(true)
      showToast('success', '¡Predicciones guardadas!')
      setTimeout(() => {
        setSavedOk(false)
        onSave?.()
      }, 900)
    } catch (err) {
      console.error('[EspecialesView] save:', err)
      showToast('error', 'Error al guardar. Intentá de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  const championFlag = championTla ? getFlagUrl(championTla) : null

  return (
    <>
      {/* Back — solo en página completa */}
      {!compact && (
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm mb-6 px-3 py-2 rounded-lg"
          style={{ color: 'var(--mundial-info)', background: 'var(--mundial-card-bg)', border: '1px solid var(--mundial-card-border)' }}
        >
          <ArrowLeft className="h-4 w-4" />
          Inicio
        </Link>
      )}

      {/* Hero — solo en página completa */}
      {!compact && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-4 mb-3">
            <Trophy className="h-8 w-8" style={{ color: 'var(--secondary)' }} />
            <div>
              <h1
                className="text-3xl font-black"
                style={{
                  color: '#fff',
                  letterSpacing: '-0.02em',
                }}
              >
                PREDICCIONES ESPECIALES
              </h1>
              <p className="text-xs mt-0.5 tracking-widest" style={{ color: 'var(--mundial-muted)' }}>
                MUNDIAL 2026 · HASTA 24 PUNTOS
              </p>
            </div>
          </div>
          <div
            className="mx-auto"
            style={{ width: 80, height: 1, background: 'rgba(0,82,165,0.45)' }}
          />
        </motion.div>
      )}

      <div className="space-y-4">
        {/* Card 1 — Campeón */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, delay: compact ? 0 : 0.05 }}
          className="card rounded-2xl"
        >
          <div
            className="px-5 py-3 flex items-center gap-3"
            style={{
              background: 'var(--mundial-header-bg)',
              borderBottom: '1px solid var(--mundial-header-border)',
              borderRadius: '1rem 1rem 0 0',
            }}
          >
            <Trophy className="h-4 w-4 shrink-0" style={{ color: 'var(--warning)' }} />
            <span className="text-sm font-black tracking-wider" style={{ color: 'var(--warning)' }}>
              CAMPEÓN DEL MUNDIAL
            </span>
            <span
              className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(246,183,60,0.12)', border: '1px solid rgba(246,183,60,0.25)', color: 'var(--warning)' }}
            >
              +12 pts
            </span>
          </div>
          <div className="p-5">
            <p className="text-xs mb-3" style={{ color: 'var(--mundial-muted)' }}>
              ¿Qué selección va a levantar la copa?
            </p>
            <TeamDropdown
              value={championTla}
              onChange={(tla, name) => { setChampionTla(tla); setChampionName(name) }}
              disabled={saving}
            />
          </div>
        </motion.div>

        {/* Card 2 — Goleador */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, delay: compact ? 0.06 : 0.12 }}
          className="card rounded-2xl"
        >
          <div
            className="px-5 py-3 flex items-center gap-3"
            style={{
              background: 'var(--mundial-header-bg)',
              borderBottom: '1px solid var(--mundial-header-border)',
              borderRadius: '1rem 1rem 0 0',
            }}
          >
            <Target className="h-4 w-4 shrink-0" style={{ color: 'var(--primary)' }} />
            <span className="text-sm font-black tracking-wider" style={{ color: 'var(--primary)' }}>
              GOLEADOR DEL TORNEO
            </span>
            <span
              className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(0,82,165,0.12)', border: '1px solid rgba(0,82,165,0.25)', color: 'var(--primary)' }}
            >
              +12 pts
            </span>
          </div>
          <div className="p-5">
            <p className="text-xs mb-3" style={{ color: 'var(--mundial-muted)' }}>
              ¿Quién va a ser el máximo artillero?
            </p>
            <ScorerCombobox value={topScorer} onChange={setTopScorer} disabled={saving} />
          </div>
        </motion.div>

        {/* Card 3 — Resumen + guardar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, delay: compact ? 0.12 : 0.2 }}
          className="card rounded-2xl"
        >
          <div
            className="px-5 py-3 flex items-center gap-3"
            style={{
              background: 'var(--mundial-header-bg)',
              borderBottom: '1px solid var(--mundial-header-border)',
              borderRadius: '1rem 1rem 0 0',
            }}
          >
            <Star className="h-4 w-4 shrink-0" style={{ color: 'var(--secondary)' }} />
            <span className="text-sm font-black tracking-wider" style={{ color: 'var(--secondary)' }}>
              TUS PREDICCIONES ESPECIALES
            </span>
          </div>
          <div className="p-5 space-y-4">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold" style={{ color: 'var(--mundial-muted)' }}>Campeón</span>
                {championTla ? (
                  <div className="flex items-center gap-2">
                    {championFlag && (
                      <img src={championFlag} alt={championTla} className="rounded-sm" style={{ width: 24, height: 17, objectFit: 'cover' }} />
                    )}
                    <span className="text-sm font-bold" style={{ color: 'var(--warning)' }}>{championName}</span>
                  </div>
                ) : (
                  <span className="text-xs" style={{ color: 'var(--mundial-muted)' }}>Sin predecir</span>
                )}
              </div>
              <div className="h-px" style={{ background: 'var(--mundial-header-border)' }} />
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold" style={{ color: 'var(--mundial-muted)' }}>Goleador</span>
                {topScorer.trim() ? (
                  <span className="text-sm font-bold" style={{ color: 'var(--primary)' }}>{topScorer.trim()}</span>
                ) : (
                  <span className="text-xs" style={{ color: 'var(--mundial-muted)' }}>Sin predecir</span>
                )}
              </div>
              <div className="h-px" style={{ background: 'var(--mundial-header-border)' }} />
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold" style={{ color: 'var(--mundial-muted)' }}>Total posible</span>
                <span className="stat-number text-sm font-black" style={{ color: 'var(--secondary)' }}>24 pts</span>
              </div>
            </div>

            <motion.button
              onClick={handleSave}
              disabled={saving || !userId}
              whileHover={!saving && !!userId ? { scale: 1.02, boxShadow: '0 8px 24px rgba(0,82,165,0.35)' } : {}}
              whileTap={!saving && !!userId ? { scale: 0.98 } : {}}
              className="w-full flex items-center justify-center gap-2.5 py-4 rounded-xl text-sm font-black tracking-wider"
              style={{
                background: savedOk
                  ? '#22c55e'
                  : saving || !userId
                  ? 'rgba(0,106,51,0.30)'
                  : '#006A33',
                color: '#fff',
                cursor: saving || !userId ? 'not-allowed' : 'pointer',
                boxShadow: savedOk ? '0 4px 20px rgba(34,197,94,0.35)' : saving || !userId ? 'none' : '0 4px 20px rgba(0,82,165,0.30)',
                transition: 'background 0.25s ease, box-shadow 0.25s ease',
              }}
            >
              {saving ? (
                <><Loader2 className="h-4 w-4 animate-spin" />Guardando...</>
              ) : savedOk ? (
                <><Check className="h-4 w-4" />¡Guardado!</>
              ) : !userId ? (
                'Iniciá sesión para guardar'
              ) : (
                'Guardar Predicciones'
              )}
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast.visible && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 500, damping: 32 }}
            className="fixed bottom-6 right-6 z-[10000] flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium"
            style={{
              background: toast.type === 'success' ? 'rgba(34,197,94,0.13)' : 'rgba(239,68,68,0.13)',
              border: `1px solid ${toast.type === 'success' ? 'rgba(34,197,94,0.35)' : 'rgba(239,68,68,0.35)'}`,
              backdropFilter: 'blur(16px)',
              color: toast.type === 'success' ? '#22c55e' : '#ef4444',
              boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
            }}
          >
            {toast.type === 'success'
              ? <Check className="h-4 w-4 shrink-0" />
              : <AlertCircle className="h-4 w-4 shrink-0" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
