'use client'

import { useRef, useState } from 'react'
import { motion, AnimatePresence, useAnimation } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Check, Clock, Trophy, AlertCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import confetti from 'canvas-confetti'
import type { Database } from '@/lib/database.types'
import { getFlagUrl } from '@/lib/flagCodes'

type Prediction = Database['public']['Tables']['predictions']['Row']

type CatConfig = { gradient: string; colors: string; icon: string; glow: string; accentRgb: string }

const CATEGORIES: Record<string, CatConfig> = {
  Fútbol:   { gradient: 'from-emerald-500 to-teal-600',  colors: '#10b981, #0d9488',  icon: '⚽', glow: 'rgba(16,185,129,0.14)',  accentRgb: '16,185,129' },
  Crypto:   { gradient: 'from-amber-500 to-yellow-600',  colors: '#f59e0b, #ca8a04',  icon: '₿',  glow: 'rgba(245,158,11,0.14)',  accentRgb: '245,158,11' },
  Clima:    { gradient: 'from-blue-500 to-sky-600',      colors: '#3b82f6, #0284c7',  icon: '☀️', glow: 'rgba(59,130,246,0.14)',  accentRgb: '59,130,246' },
  Política: { gradient: 'from-rose-500 to-red-600',      colors: '#f43f5e, #dc2626',  icon: '🗳️', glow: 'rgba(244,63,94,0.14)',   accentRgb: '244,63,94' },
  Deporte:  { gradient: 'from-green-500 to-emerald-600', colors: '#22c55e, #10b981',  icon: '🏆', glow: 'rgba(34,197,94,0.14)',   accentRgb: '34,197,94' },
  Trivias:  { gradient: 'from-violet-500 to-purple-600', colors: '#8b5cf6, #7c3aed', icon: '🧠', glow: 'rgba(139,92,246,0.14)', accentRgb: '139,92,246' },
}
const DEFAULT_CAT: CatConfig = {
  gradient: 'from-violet-500 to-purple-600',
  colors: '#8b5cf6, #7c3aed',
  icon: '🎯',
  glow: 'rgba(139,92,246,0.14)',
  accentRgb: '139,92,246',
}

const STAGE_LABELS: Record<string, string> = {
  GROUP_STAGE:    'Fase de Grupos',
  LAST_16:        'Dieciseisavos de Final',
  ROUND_OF_16:    'Octavos de Final',
  QUARTER_FINALS: 'Cuartos de Final',
  SEMI_FINALS:    'Semifinales',
  THIRD_PLACE:    'Tercer Puesto',
  FINAL:          'Final',
}

function parseMundialDesc(description: string | null) {
  if (!description) return { stageLabel: '', venue: '' }
  const stage = description.match(/Fase: ([A-Z_]+)/)?.[1] ?? ''
  const venue = description.match(/Estadio: (.+)/)?.[1] ?? ''
  return { stageLabel: STAGE_LABELS[stage] ?? stage, venue }
}

interface Props {
  prediction: Prediction
  existingAnswer: string | null
  userId: string | null
  index?: number
  voteDistribution?: Record<string, number>
}

export default function PredictionCard({ prediction, existingAnswer, userId, index = 0, voteDistribution = {} }: Props) {
  const [selected, setSelected] = useState<string | null>(existingAnswer)
  const [localVotes, setLocalVotes] = useState<Record<string, number>>(voteDistribution)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; visible: boolean }>({
    type: 'success',
    visible: false,
  })
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const innerControls = useAnimation()
  const supabase = useRef(createClient()).current

  const cat = CATEGORIES[prediction.category] ?? DEFAULT_CAT
  const options = Array.isArray(prediction.options) ? (prediction.options as string[]) : []
  const points = Math.round(prediction.difficulty_multiplier * 10)

  const isMundial = !!prediction.fixture_id && prediction.category === 'Fútbol'
  const homeFlag = isMundial ? getFlagUrl(prediction.home_team_code) : null
  const awayFlag = isMundial ? getFlagUrl(prediction.away_team_code) : null
  const mundialInfo = isMundial ? parseMundialDesc(prediction.description) : { stageLabel: '', venue: '' }

  const deadline = new Date(prediction.deadline)
  const remainingMs = deadline.getTime() - Date.now()
  const totalMs = deadline.getTime() - new Date(prediction.created_at).getTime()
  const timePct = Math.max(0, Math.min(100, (remainingMs / totalMs) * 100))
  const timeLeft = formatDistanceToNow(deadline, { locale: es })
  const isUrgent = timePct < 20
  const timeBarColors =
    timePct > 50 ? '#4ade80, #10b981' : timePct > 20 ? '#facc15, #f97316' : '#f87171, #ef4444'

  const fireToast = (type: 'success' | 'error') => {
    clearTimeout(toastTimer.current)
    setToast({ type, visible: true })
    toastTimer.current = setTimeout(() => setToast((t) => ({ ...t, visible: false })), 3000)
  }

  const handleSelect = async (option: string) => {
    if (selected || saving) return
    if (!userId) {
      await innerControls.start({ x: [0, -8, 8, -8, 8, -4, 4, 0], transition: { duration: 0.45 } })
      fireToast('error')
      return
    }
    setSaving(true)
    const { error } = await supabase.from('user_predictions').insert({
      user_id: userId,
      prediction_id: prediction.id,
      predicted_answer: option,
    })
    if (!error) {
      setSelected(option)
      setLocalVotes(prev => ({ ...prev, [option]: (prev[option] ?? 0) + 1 }))
      confetti({
        particleCount: 38,
        spread: 58,
        origin: { y: 0.75 },
        colors: ['#4f91ff', '#8b5cf6', '#06b6d4', '#22c55e', '#f59e0b'],
        ticks: 180,
        gravity: 1.1,
        scalar: 0.85,
        disableForReducedMotion: true,
      })
      fireToast('success')
    }
    setSaving(false)
  }

  const colsClass = options.length === 2 ? 'grid-cols-2' : 'grid-cols-3'

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.08, ease: 'easeOut' }}
        whileHover={{
          y: -4,
          boxShadow: `0 16px 40px ${cat.glow}, 0 0 0 1px rgba(${cat.accentRgb},0.18)`,
        }}
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          backdropFilter: 'blur(8px)',
          transition: 'box-shadow 0.3s ease, border-color 0.3s ease, background 0.35s ease',
        }}
      >
        {/* Category color strip */}
        {isMundial ? (
          <div className="h-[2px]" style={{ background: 'linear-gradient(to right, #fbbf24, #f59e0b, #d97706, #f59e0b, #fbbf24)' }} />
        ) : (
          <div className={`h-px bg-gradient-to-r ${cat.gradient} opacity-70`} />
        )}

        <motion.div animate={innerControls} className="p-5">
          {/* Header */}
          {isMundial ? (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <span
                  className="px-2.5 py-0.5 rounded-full text-xs font-bold"
                  style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', color: '#78350f' }}
                >
                  ⚽ MUNDIAL 2026
                </span>
                <span className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-semibold text-white bg-gradient-to-r ${cat.gradient}`}>
                  {prediction.category}
                </span>
              </div>
              <div className="flex items-center justify-center gap-4 py-2 mb-2">
                <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
                  {homeFlag && <img src={homeFlag} alt="" className="h-7 w-auto rounded-sm" />}
                  <span className="text-xs font-semibold text-center w-full truncate" style={{ color: 'var(--text-primary)' }}>
                    {options[0]}
                  </span>
                </div>
                <span className="text-xs font-bold shrink-0" style={{ color: 'var(--text-muted)' }}>VS</span>
                <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
                  {awayFlag && <img src={awayFlag} alt="" className="h-7 w-auto rounded-sm" />}
                  <span className="text-xs font-semibold text-center w-full truncate" style={{ color: 'var(--text-primary)' }}>
                    {options[2]}
                  </span>
                </div>
              </div>
              {(mundialInfo.stageLabel || mundialInfo.venue) && (
                <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
                  {[mundialInfo.stageLabel, mundialInfo.venue].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>
          ) : (
            <div className="flex items-start gap-3 mb-4">
              <motion.span
                className="text-2xl shrink-0 mt-0.5"
                animate={{ rotate: [0, -5, 5, 0] }}
                transition={{ duration: 3, repeat: Infinity, delay: index * 0.5 }}
              >
                {cat.icon}
              </motion.span>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <h3
                    className="font-semibold text-base leading-snug"
                    style={{ color: 'var(--text-primary)', transition: 'color 0.25s ease' }}
                  >
                    {prediction.title}
                  </h3>
                  <span
                    className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-semibold text-white bg-gradient-to-r ${cat.gradient}`}
                  >
                    {prediction.category}
                  </span>
                </div>
                {prediction.description && (
                  <p
                    className="text-sm mt-1 leading-relaxed"
                    style={{ color: 'var(--text-secondary)', transition: 'color 0.25s ease' }}
                  >
                    {prediction.description}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Options */}
          {options.length > 0 && (
            <div className={`grid ${colsClass} gap-2 mb-4`}>
              {options.map((option, optIdx) => {
                const isChosen = selected === option
                const isDimmed = selected !== null && !isChosen
                const mundialFlag = isMundial
                  ? (optIdx === 0 ? homeFlag : optIdx === 2 ? awayFlag : null)
                  : null
                return (
                  <motion.button
                    key={option}
                    onClick={() => handleSelect(option)}
                    disabled={!!selected || saving}
                    whileHover={!selected ? { scale: 1.04, y: -1 } : {}}
                    whileTap={!selected ? { scale: 0.96 } : {}}
                    transition={{ type: 'spring', stiffness: 420, damping: 18 }}
                    className={`relative flex ${isMundial ? 'flex-col' : ''} items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium`}
                    style={{
                      background: isChosen
                        ? isMundial ? 'linear-gradient(135deg, #f59e0b, #d97706)' : `linear-gradient(135deg, ${cat.colors})`
                        : isDimmed
                        ? 'var(--bg-option-dimmed)'
                        : 'var(--bg-option)',
                      border: isChosen
                        ? 'none'
                        : `1px solid ${isDimmed ? 'var(--border-color)' : 'var(--border-hover)'}`,
                      boxShadow: isChosen
                        ? isMundial ? '0 2px 10px rgba(245,158,11,0.25)' : `0 2px 10px rgba(${cat.accentRgb},0.20)`
                        : 'none',
                      color: isChosen
                        ? '#fff'
                        : isDimmed
                        ? 'var(--text-option-dimmed)'
                        : 'var(--text-option)',
                      transition: 'background 0.2s ease, color 0.2s ease',
                    }}
                  >
                    {isMundial && (
                      <span className="leading-none mb-0.5">
                        {mundialFlag
                          ? <img src={mundialFlag} alt="" className="h-5 w-auto rounded-sm" />
                          : <span className="text-base">⚖️</span>
                        }
                      </span>
                    )}
                    <AnimatePresence>
                      {isChosen && (
                        <motion.span
                          initial={{ scale: 0, rotate: -90 }}
                          animate={{ scale: 1, rotate: 0 }}
                          exit={{ scale: 0 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                        >
                          <Check className="h-3.5 w-3.5 shrink-0" />
                        </motion.span>
                      )}
                    </AnimatePresence>
                    <span className="text-center leading-tight">{option}</span>
                  </motion.button>
                )
              })}
            </div>
          )}

          {/* Vote distribution — shown after voting */}
          {selected !== null && Object.keys(localVotes).length > 0 && (
            <div className="mb-3.5">
              <div className="space-y-1.5">
                {options.map(option => {
                  const total = Object.values(localVotes).reduce((a, b) => a + b, 0)
                  const count = localVotes[option] ?? 0
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0
                  const isChosen = option === selected
                  return (
                    <div key={option}>
                      <div className="flex items-center justify-between text-xs mb-0.5">
                        <span style={{ color: isChosen ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: isChosen ? 500 : 400 }}>
                          {option}
                        </span>
                        <span style={{ color: 'var(--text-muted)' }}>{pct}%</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--time-bar-track)' }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.7, ease: 'easeOut', delay: 0.05 }}
                          style={{
                            height: '100%',
                            borderRadius: '9999px',
                            background: isChosen
                              ? `linear-gradient(to right, ${cat.colors})`
                              : 'var(--border-hover)',
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
                <p className="text-right text-xs" style={{ color: 'var(--text-muted)' }}>
                  {Object.values(localVotes).reduce((a, b) => a + b, 0)} votos
                </p>
              </div>
            </div>
          )}

          {/* Time bar */}
          <div className="mb-3.5">
            <div
              className="h-[3px] rounded-full overflow-hidden"
              style={{ background: 'var(--time-bar-track)' }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${timePct}%` }}
                transition={{ duration: 1.2, ease: 'easeOut', delay: index * 0.08 + 0.2 }}
                className={isUrgent ? 'animate-pulse' : ''}
                style={{
                  height: '100%',
                  borderRadius: '9999px',
                  background: `linear-gradient(to right, ${timeBarColors})`,
                }}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <div
              className="flex items-center gap-1.5 text-xs"
              style={{ color: isUrgent ? '#f87171' : 'var(--text-secondary)' }}
            >
              <Clock className={`h-3.5 w-3.5 ${isUrgent ? 'animate-pulse' : ''}`} />
              <span>Cierra en {timeLeft}</span>
            </div>
            <div
              className="flex items-center gap-1 text-xs font-bold"
              style={{ color: '#f59e0b', textShadow: '0 0 10px rgba(245,158,11,0.5)' }}
            >
              <Trophy className="h-3.5 w-3.5" />
              <span>+{points} pts</span>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Toast */}
      <AnimatePresence>
        {toast.visible && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9, x: 20 }}
            animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 500, damping: 32 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium"
            style={{
              background: toast.type === 'success' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
              border: `1px solid ${toast.type === 'success' ? 'rgba(34,197,94,0.35)' : 'rgba(239,68,68,0.35)'}`,
              backdropFilter: 'blur(16px)',
              color: toast.type === 'success' ? '#22c55e' : '#ef4444',
              boxShadow:
                toast.type === 'success'
                  ? '0 8px 32px rgba(34,197,94,0.12)'
                  : '0 8px 32px rgba(239,68,68,0.12)',
            }}
          >
            {toast.type === 'success' ? (
              <>
                <motion.div
                  initial={{ rotate: -90, scale: 0 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                >
                  <Check className="h-4 w-4 shrink-0" />
                </motion.div>
                ¡Predicción guardada!
              </>
            ) : (
              <>
                <motion.div
                  animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
                  transition={{ duration: 0.4 }}
                >
                  <AlertCircle className="h-4 w-4 shrink-0" />
                </motion.div>
                Iniciá sesión para predecir
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
