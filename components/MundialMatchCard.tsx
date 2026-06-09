'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { savePrediction } from '@/app/actions/predictions'
import { Trophy, Users, Check, AlertCircle } from 'lucide-react'
import confetti from 'canvas-confetti'
import { getFlagUrl } from '@/lib/flagCodes'
import { pyTime, getTeamNameES } from '@/lib/worldcup'
import type { Database } from '@/lib/database.types'

type Prediction = Database['public']['Tables']['predictions']['Row']

const STAGE_LABELS: Record<string, string> = {
  GROUP_STAGE: 'Fase de Grupos',
  ROUND_OF_16: 'Octavos de Final',
  QUARTER_FINALS: 'Cuartos de Final',
  SEMI_FINALS: 'Semifinales',
  THIRD_PLACE: 'Tercer Puesto',
  FINAL: 'Final',
}

function parseMundialDesc(description: string | null) {
  if (!description) return { stage: '', stageLabel: '', venue: '' }
  const stage = description.match(/Fase: ([A-Z_]+)/)?.[1] ?? ''
  const venue = description.match(/Estadio: (.+)/)?.[1] ?? ''
  return { stage, stageLabel: STAGE_LABELS[stage] ?? stage, venue }
}

function useCountdown(targetMs: number) {
  const [remaining, setRemaining] = useState<number | null>(null)
  useEffect(() => {
    const update = () => Math.max(0, targetMs - Date.now())
    setRemaining(update())
    const timer = setInterval(() => {
      const r = update()
      setRemaining(r)
      if (r === 0) clearInterval(timer)
    }, 1000)
    return () => clearInterval(timer)
  }, [targetMs])
  return remaining
}

function formatCountdown(ms: number): string {
  const s = Math.floor(ms / 1000)
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (d > 0) return `${d}d ${h}h ${m}m`
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${String(sec).padStart(2, '0')}s`
  return `${sec}s`
}

interface Props {
  prediction: Prediction
  existingAnswer: string | null
  userId: string | null
  voteDistribution?: Record<string, number>
  index?: number
}

export default function MundialMatchCard({
  prediction,
  existingAnswer,
  userId,
  voteDistribution = {},
  index = 0,
}: Props) {
  const [selected, setSelected] = useState<string | null>(existingAnswer)
  const [localVotes, setLocalVotes] = useState<Record<string, number>>(voteDistribution)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message?: string; visible: boolean }>({
    type: 'success',
    visible: false,
  })
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const options = Array.isArray(prediction.options) ? (prediction.options as string[]) : []
  const homeTeam = getTeamNameES(options[0] ?? '')
  const awayTeam = getTeamNameES(options[2] ?? '')
  const homeFlag = getFlagUrl(prediction.home_team_code)
  const awayFlag = getFlagUrl(prediction.away_team_code)

  const deadline = new Date(prediction.deadline)
  const kickoff = new Date(deadline.getTime() + 10 * 60 * 1000)
  const now = new Date()

  const isOpen = prediction.status === 'open' && deadline > now
  const isLive = !isOpen && prediction.status !== 'resolved'
  const isResolved = prediction.status === 'resolved'

  const remaining = useCountdown(deadline.getTime())
  const showCountdown = isOpen && remaining !== null && remaining < 24 * 3600 * 1000
  const isUrgent = remaining !== null && remaining < 3600 * 1000

  const totalVotes = Object.values(localVotes).reduce((a, b) => a + b, 0)
  const points = Math.round(prediction.difficulty_multiplier * 10)
  const { stageLabel, venue } = parseMundialDesc(prediction.description)

  const fireToast = (type: 'success' | 'error', message?: string) => {
    clearTimeout(toastTimer.current)
    setToast({ type, message, visible: true })
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000)
  }

  const handleSelect = async (option: string) => {
    console.log('[handleSelect] Started:', { option, predictionId: prediction.id, userId })
    if (selected || saving || !isOpen) return
    if (!userId) { fireToast('error', 'Iniciá sesión para predecir'); return }
    setSaving(true)
    try {
      const result = await savePrediction({
        predictionId: prediction.id,
        answer: option,
        homeScore: null,
        awayScore: null,
      })
      console.log('[handleSelect] result:', result)
      if (result.error) throw new Error(result.error)
      setSelected(option)
      setLocalVotes(prev => ({ ...prev, [option]: (prev[option] ?? 0) + 1 }))
      confetti({
        particleCount: 50,
        spread: 65,
        origin: { y: 0.72 },
        colors: ['#FFD700', '#FFA500', '#ffffff', '#22c55e', '#60a5fa'],
        ticks: 220,
        gravity: 1.15,
        scalar: 0.85,
        disableForReducedMotion: true,
      })
      fireToast('success')
    } catch (err: unknown) {
      console.error('[handleSelect] Error:', err)
      fireToast('error', 'Error al guardar. Intentá de nuevo')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38, delay: index * 0.055, ease: 'easeOut' }}
        whileHover={{
          y: -3,
          boxShadow: '0 20px 56px rgba(0,0,0,0.30), 0 0 0 1px rgba(0,82,165,0.35)',
        }}
        className="card-match"
      >
        {/* Match header */}
        <div
          className="px-5 py-3 flex items-center justify-between gap-2"
          style={{
            background: 'var(--mundial-header-bg)',
            borderBottom: '1px solid var(--mundial-header-border)',
          }}
        >
          <div className="flex items-center gap-2 min-w-0 text-xs">
            {isLive && (
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full font-bold shrink-0"
                style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }}>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                EN VIVO
              </span>
            )}
            {isResolved && (
              <span className="px-2 py-0.5 rounded-full font-semibold shrink-0 text-xs"
                style={{ background: 'rgba(167,139,250,0.12)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.22)' }}>
                FINALIZADO
              </span>
            )}
            {stageLabel && !isLive && !isResolved && (
              <span className="truncate text-xs" style={{ color: 'var(--mundial-info)', letterSpacing: '0.04em' }}>
                {stageLabel.toUpperCase()}
              </span>
            )}
            {venue && venue !== 'Estadio TBD' && (
              <span className="truncate hidden sm:inline text-xs" style={{ color: 'var(--mundial-muted)' }}>
                · {venue}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {showCountdown && remaining !== null && (
              <span
                className="text-xs font-bold tabular-nums px-2 py-0.5 rounded-full"
                style={{
                  background: isUrgent ? 'rgba(206,17,38,0.12)' : 'rgba(0,82,165,0.12)',
                  color: isUrgent ? '#f87171' : '#60a5fa',
                  border: `1px solid ${isUrgent ? 'rgba(206,17,38,0.25)' : 'rgba(0,82,165,0.25)'}`,
                }}
              >
                {formatCountdown(remaining)}
              </span>
            )}
            <span className="text-xs font-semibold" style={{ color: 'var(--mundial-info)' }}>
              {pyTime(kickoff)}
            </span>
          </div>
        </div>

        <div className="p-6">
          {/* Teams */}
          <div className="flex items-center justify-center gap-4 mb-6">
            {/* Home team */}
            <div className="flex flex-col items-center gap-2.5 flex-1 min-w-0">
              <motion.div
                whileHover={{ scale: 1.06 }}
                transition={{ type: 'spring', stiffness: 380, damping: 14 }}
                className="rounded-2xl overflow-hidden"
                style={{ width: 80, height: 56, boxShadow: '0 8px 24px rgba(0,0,0,0.30)', flexShrink: 0 }}
              >
                {homeFlag ? (
                  <img src={homeFlag} alt={homeTeam} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl"
                    style={{ background: 'var(--mundial-flag-bg)' }}>
                    🏳
                  </div>
                )}
              </motion.div>
              <span className="text-center text-xs font-bold w-full"
                style={{
                  color: 'var(--mundial-team-name)',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  lineHeight: 1.3,
                  WebkitLineClamp: 2,
                  display: '-webkit-box',
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}>
                {homeTeam}
              </span>
            </div>

            {/* Center */}
            <div className="flex flex-col items-center gap-1.5 shrink-0 w-12">
              <span className="text-base font-black" style={{ color: 'var(--mundial-vs)', letterSpacing: '0.08em' }}>
                VS
              </span>
              {isResolved && prediction.correct_answer && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.25)' }}>
                  {prediction.correct_answer === homeTeam ? '1' :
                   prediction.correct_answer === awayTeam ? '2' : 'X'}
                </span>
              )}
            </div>

            {/* Away team */}
            <div className="flex flex-col items-center gap-2.5 flex-1 min-w-0">
              <motion.div
                whileHover={{ scale: 1.06 }}
                transition={{ type: 'spring', stiffness: 380, damping: 14 }}
                className="rounded-2xl overflow-hidden"
                style={{ width: 80, height: 56, boxShadow: '0 8px 24px rgba(0,0,0,0.30)', flexShrink: 0 }}
              >
                {awayFlag ? (
                  <img src={awayFlag} alt={awayTeam} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl"
                    style={{ background: 'var(--mundial-flag-bg)' }}>
                    🏳
                  </div>
                )}
              </motion.div>
              <span className="text-center text-xs font-bold w-full"
                style={{
                  color: 'var(--mundial-team-name)',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  lineHeight: 1.3,
                  WebkitLineClamp: 2,
                  display: '-webkit-box',
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}>
                {awayTeam}
              </span>
            </div>
          </div>

          {/* Prediction area */}
          {isLive && !isResolved ? (
            <div
              className="text-center py-3 rounded-2xl text-xs font-medium mb-5"
              style={{
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.18)',
                color: '#f87171',
              }}
            >
              ⚠️ El partido ya comenzó · Predicciones cerradas
            </div>
          ) : isResolved ? (
            <div
              className="text-center py-3 rounded-2xl text-xs font-medium mb-5"
              style={{
                background: 'rgba(139,92,246,0.08)',
                border: '1px solid rgba(139,92,246,0.18)',
                color: 'var(--mundial-info)',
              }}
            >
              Ganador:{' '}
              <span className="font-bold" style={{ color: '#a78bfa' }}>
                {prediction.correct_answer ?? '—'}
              </span>
            </div>
          ) : (
            <>
              <p className="text-center text-xs font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.35)', letterSpacing: '0.06em' }}>
                ¿QUIÉN GANARÁ?
              </p>
              <div className="grid grid-cols-3 gap-2 mb-5">
                {options.map((option, optIdx) => {
                  const isChosen = selected === option
                  const isDimmed = selected !== null && !isChosen
                  const flag = optIdx === 0 ? homeFlag : optIdx === 2 ? awayFlag : null
                  const CODE = optIdx === 0 ? '1' : optIdx === 1 ? 'X' : '2'
                  const DEFAULT_BG =
                    optIdx === 0 ? 'rgba(0,106,51,0.18)' :
                    optIdx === 1 ? 'rgba(255,255,255,0.07)' :
                    'rgba(0,82,165,0.18)'
                  const DEFAULT_BORDER =
                    optIdx === 0 ? 'rgba(0,106,51,0.35)' :
                    optIdx === 1 ? 'rgba(255,255,255,0.12)' :
                    'rgba(0,82,165,0.35)'
                  const DEFAULT_COLOR =
                    optIdx === 0 ? '#4ade80' :
                    optIdx === 1 ? 'rgba(255,255,255,0.55)' :
                    '#60a5fa'
                  const CHOSEN_BG =
                    optIdx === 0 ? '#006A33' :
                    optIdx === 1 ? 'rgba(255,255,255,0.18)' :
                    '#0052A5'
                  return (
                    <motion.button
                      key={option || `option-${optIdx}`}
                      onClick={() => handleSelect(option)}
                      disabled={!!selected || saving}
                      whileHover={!selected ? { scale: 1.04, y: -2 } : {}}
                      whileTap={!selected ? { scale: 0.96 } : {}}
                      transition={{ type: 'spring', stiffness: 420, damping: 18 }}
                      className="relative flex flex-col items-center justify-center gap-1.5 rounded-2xl font-bold"
                      style={{
                        minHeight: 76,
                        padding: '10px 8px',
                        background: isChosen ? CHOSEN_BG : isDimmed ? 'rgba(255,255,255,0.03)' : DEFAULT_BG,
                        border: `1px solid ${isChosen ? 'transparent' : isDimmed ? 'rgba(255,255,255,0.06)' : DEFAULT_BORDER}`,
                        boxShadow: isChosen
                          ? optIdx === 0 ? '0 6px 20px rgba(0,106,51,0.40)' : optIdx === 2 ? '0 6px 20px rgba(0,82,165,0.40)' : 'none'
                          : 'none',
                        color: isChosen ? '#fff' : isDimmed ? 'rgba(255,255,255,0.20)' : DEFAULT_COLOR,
                        transition: 'all 0.18s ease',
                      }}
                    >
                      {isChosen && (
                        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-1.5 right-1.5">
                          <Check className="h-3 w-3" />
                        </motion.span>
                      )}
                      {flag && (
                        <img src={flag} alt="" className="rounded" style={{ width: 28, height: 20, objectFit: 'cover', opacity: isDimmed ? 0.3 : 1 }} />
                      )}
                      <span className="stat-number text-xl leading-none">{CODE}</span>
                      <span className="text-[10px] leading-tight text-center" style={{ opacity: isDimmed ? 0.3 : 0.7 }}>
                        {optIdx === 1 ? 'Empate' : optIdx === 0 ? 'Local' : 'Visitante'}
                      </span>
                    </motion.button>
                  )
                })}
              </div>
            </>
          )}

          {/* Vote distribution */}
          {(selected !== null || isResolved) && Object.keys(localVotes).length > 0 && (
            <div className="mb-4 space-y-1.5">
              {options.map((option, optIdx) => {
                const count = localVotes[option] ?? 0
                const total = Object.values(localVotes).reduce((a, b) => a + b, 0)
                const pct = total > 0 ? Math.round((count / total) * 100) : 0
                const isChosen = option === selected
                const isWinner = isResolved && option === prediction.correct_answer
                return (
                  <div key={option || `vote-${optIdx}`}>
                    <div className="flex justify-between text-xs mb-0.5">
                      <span style={{
                        color: isWinner ? '#4ade80' : isChosen ? '#60a5fa' : 'var(--mundial-vote-label)',
                        fontWeight: isChosen || isWinner ? 600 : 400,
                      }}>
                        {option}{isWinner ? ' ✓' : ''}
                      </span>
                      <span style={{ color: 'var(--mundial-vote-pct)' }}>{pct}%</span>
                    </div>
                    <div className="progress-bar" style={{ height: '0.375rem' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.75, ease: 'easeOut', delay: 0.05 }}
                        className={`progress-bar-fill${isWinner ? '--success' : isChosen ? '' : '--muted'}`}
                        style={{
                          height: '100%',
                          borderRadius: '9999px',
                          background: isWinner
                            ? '#22c55e'
                            : isChosen
                            ? '#006A33'
                            : 'var(--mundial-vote-inactive)',
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--mundial-footer-text)' }}>
              <Users className="h-3.5 w-3.5" />
              <span>{totalVotes.toLocaleString()} predicciones</span>
            </div>
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
              style={{
                background: 'rgba(0,106,51,0.14)',
                border: '1px solid rgba(0,106,51,0.28)',
                color: 'var(--success)',
              }}
            >
              <Trophy className="h-3 w-3" />
              <span>+{points} pts</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Toast */}
      <AnimatePresence>
        {toast.visible && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 500, damping: 32 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium"
            style={{
              background: toast.type === 'success' ? 'rgba(34,197,94,0.13)' : 'rgba(239,68,68,0.13)',
              border: `1px solid ${toast.type === 'success' ? 'rgba(34,197,94,0.35)' : 'rgba(239,68,68,0.35)'}`,
              backdropFilter: 'blur(16px)',
              color: toast.type === 'success' ? '#22c55e' : '#ef4444',
              boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
            }}
          >
            {toast.type === 'success' ? (
              <><Check className="h-4 w-4 shrink-0" /> ¡Predicción guardada!</>
            ) : (
              <><AlertCircle className="h-4 w-4 shrink-0" /> {toast.message ?? 'Iniciá sesión para predecir'}</>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
