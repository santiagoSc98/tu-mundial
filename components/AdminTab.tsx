'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Check, AlertCircle, Loader2, RefreshCw, Trash2, Download } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { getFlagUrl } from '@/lib/flagCodes'
import type { Database } from '@/lib/database.types'

type Prediction = Database['public']['Tables']['predictions']['Row']
type PredictionRow = Prediction & { responseCount: number }

const STATUS_BADGE: Record<string, { label: string; color: string; bg: string; border: string }> = {
  open:     { label: 'Abierta',  color: '#22c55e', bg: 'rgba(34,197,94,0.10)',   border: 'rgba(34,197,94,0.25)' },
  closed:   { label: 'Cerrada',  color: '#f59e0b', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.25)' },
  resolved: { label: 'Resuelta', color: '#a78bfa', bg: 'rgba(139,92,246,0.10)', border: 'rgba(139,92,246,0.25)' },
}

const STAGE_LABELS: Record<string, string> = {
  GROUP_STAGE: 'Grupos', ROUND_OF_16: 'Octavos', QUARTER_FINALS: 'Cuartos',
  SEMI_FINALS: 'Semis', THIRD_PLACE: '3er Puesto', FINAL: 'Final',
}

function parseStage(description: string | null): string {
  if (!description) return ''
  return description.match(/Fase: ([A-Z_]+)/)?.[1] ?? ''
}

const CARD: React.CSSProperties = {
  background: 'var(--mundial-card-bg)',
  border: '1px solid var(--mundial-card-border)',
  backdropFilter: 'blur(12px)',
  borderRadius: '1rem',
  overflow: 'hidden',
}

export default function AdminTab() {
  const supabase = useRef(createClient()).current
  const [predictions, setPredictions] = useState<PredictionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [resolving, setResolving] = useState(false)
  const [importing, setImporting] = useState(false)
  const [verifying, setVerifying] = useState<Record<string, boolean>>({})
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [lastResult, setLastResult] = useState<{ checked: number; resolved: number; usersAwarded: number } | null>(null)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string; visible: boolean }>({
    type: 'success', message: '', visible: false,
  })
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const showToast = (type: 'success' | 'error', message: string) => {
    clearTimeout(toastTimer.current)
    setToast({ type, message, visible: true })
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, visible: false })), 5000)
  }

  const fetchPredictions = async () => {
    const [{ data: preds }, { data: userPreds }] = await Promise.all([
      supabase
        .from('predictions')
        .select('*')
        .not('fixture_id', 'is', null)
        .order('deadline', { ascending: true }),
      supabase.from('user_predictions').select('prediction_id'),
    ])
    const countMap: Record<string, number> = {}
    userPreds?.forEach(up => { countMap[up.prediction_id] = (countMap[up.prediction_id] ?? 0) + 1 })
    setPredictions((preds ?? []).map(p => ({ ...p, responseCount: countMap[p.id] ?? 0 })))
    setLoading(false)
  }

  useEffect(() => { fetchPredictions() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleImportSquads = async () => {
    setImporting(true)
    try {
      const res = await fetch('/api/mundial/squads')
      const data = await res.json()
      if (!res.ok) {
        showToast('error', data.error ?? 'Error al importar planteles')
        return
      }
      showToast('success', `${data.total} jugadores importados de ${data.teams} selecciones`)
    } catch (err) {
      console.error('[AdminTab] import-squads:', err)
      showToast('error', 'Error al conectar con el servidor')
    } finally {
      setImporting(false)
    }
  }

  const handleResolveAll = async () => {
    setResolving(true)
    try {
      const res = await fetch('/api/cron/resolve-matches')
      const data = await res.json()
      if (!res.ok) {
        showToast('error', data.error ?? 'Error al resolver partidos')
        return
      }
      const { checked, resolved, usersAwarded } = data
      setLastResult({ checked, resolved, usersAwarded })
      setLastChecked(new Date())
      if (resolved === 0) {
        showToast('error', `Revisados ${checked} partido${checked !== 1 ? 's' : ''} — ninguno finalizado todavía`)
      } else {
        showToast('success', `✓ ${resolved} partido${resolved !== 1 ? 's' : ''} resuelto${resolved !== 1 ? 's' : ''} · ${usersAwarded} usuario${usersAwarded !== 1 ? 's' : ''} premiado${usersAwarded !== 1 ? 's' : ''}`)
        fetchPredictions()
      }
    } catch (err) {
      console.error('[AdminTab] resolve-all:', err)
      showToast('error', 'Error al conectar con el servidor')
    } finally {
      setResolving(false)
    }
  }

  const handleVerify = async (pred: PredictionRow) => {
    if (!pred.fixture_id) return
    setVerifying(v => ({ ...v, [pred.id]: true }))
    try {
      const res = await fetch(`/api/mundial/match/${pred.fixture_id}`)
      const data = await res.json()
      if (!data.finished) {
        showToast('error', 'El partido todavía no terminó')
        return
      }

      // Determine winner from score and derive correct_answer from opts[]
      // so it always matches what users voted (no English/Spanish mismatch)
      const opts = Array.isArray(pred.options) ? (pred.options as string[]) : []
      const homeOpt = opts[0] ?? ''
      const drawOpt = opts[1] ?? 'Empate'
      const awayOpt = opts[2] ?? ''
      let correctAnswer: string
      if (data.homeScore > data.awayScore) correctAnswer = homeOpt
      else if (data.awayScore > data.homeScore) correctAnswer = awayOpt
      else correctAnswer = drawOpt

      const nrm = (s: string) =>
        (s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()

      const points = Math.round(pred.difficulty_multiplier * 10)
      const { data: userPreds } = await supabase
        .from('user_predictions').select('*').eq('prediction_id', pred.id)
      await supabase.from('predictions').update({
        correct_answer: correctAnswer, status: 'resolved', auto_resolved: true,
      }).eq('id', pred.id)
      let correctCount = 0
      if (userPreds?.length) {
        for (const up of userPreds) {
          // Normalize comparison so "Corea del Sur" matches "South Korea" after stripping accents
          const isCorrect = nrm(up.predicted_answer) === nrm(correctAnswer)
          if (isCorrect) correctCount++
          const { error: upErr } = await supabase.from('user_predictions').update({
            is_correct: isCorrect, points_earned: isCorrect ? points : 0,
          }).eq('id', up.id)
          if (upErr) { console.error('[AdminTab] update user_prediction:', upErr); continue }
          const { data: profile } = await supabase
            .from('profiles').select('total_points, current_streak').eq('id', up.user_id).single()
          if (profile) {
            await supabase.from('profiles').update({
              total_points: profile.total_points + (isCorrect ? points : 0),
              current_streak: isCorrect ? profile.current_streak + 1 : 0,
            }).eq('id', up.user_id)
          }
        }
      }
      showToast('success', `✓ ${data.homeName} ${data.homeScore}–${data.awayScore} ${data.awayName} → ${correctAnswer} · ${correctCount} acierto${correctCount !== 1 ? 's' : ''}`)
      fetchPredictions()
    } catch (err) {
      console.error('[AdminTab] verify:', err)
      showToast('error', 'Error al verificar el resultado')
    } finally {
      setVerifying(v => ({ ...v, [pred.id]: false }))
    }
  }

  const handleDelete = async (id: string) => {
    await supabase.from('user_predictions').delete().eq('prediction_id', id)
    await supabase.from('predictions').delete().eq('id', id)
    setDeleteId(null)
    fetchPredictions()
  }

  const pending = predictions.filter(p => p.status !== 'resolved' && new Date(p.deadline) < new Date())
  const totalResolved = predictions.filter(p => p.status === 'resolved').length

  return (
    <>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-montserrat, system-ui)', margin: 0, marginBottom: 4, letterSpacing: '-0.01em' }}>
          Admin
        </h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.40)', margin: 0 }}>
          Solo visible para administradores
        </p>
      </div>

      <div className="space-y-4">
        {/* Import squads card */}
        <div style={CARD}>
          <div className="px-5 py-3" style={{ background: 'var(--mundial-header-bg)', borderBottom: '1px solid var(--mundial-header-border)' }}>
            <span className="text-sm font-black tracking-wider" style={{ color: '#0052A5' }}>IMPORTAR PLANTELES</span>
          </div>
          <div className="p-5 space-y-4">
            <p className="text-sm" style={{ color: 'var(--mundial-muted)' }}>
              Descarga los planteles del Mundial 2026 desde Football-Data.org. El proceso puede tardar varios minutos (límite de 10 req/min en el plan gratuito).
            </p>
            <motion.button
              onClick={handleImportSquads}
              disabled={importing}
              whileHover={!importing ? { scale: 1.02 } : {}}
              whileTap={!importing ? { scale: 0.98 } : {}}
              className="w-full flex items-center justify-center gap-2.5 py-4 rounded-xl text-sm font-black"
              style={{
                background: importing ? 'rgba(0,82,165,0.30)' : '#0052A5',
                color: '#fff',
                cursor: importing ? 'not-allowed' : 'pointer',
                boxShadow: importing ? 'none' : '0 4px 20px rgba(0,82,165,0.30)',
              }}
            >
              {importing
                ? <><Loader2 className="h-4 w-4 animate-spin" />Importando planteles...</>
                : <><Download className="h-4 w-4" />Importar Planteles</>}
            </motion.button>
          </div>
        </div>

        {/* Auto-resolve card */}
        <div style={CARD}>
          <div className="px-5 py-3" style={{ background: 'var(--mundial-header-bg)', borderBottom: '1px solid var(--mundial-header-border)' }}>
            <span className="text-sm font-black tracking-wider" style={{ color: '#22c55e' }}>🔄 VERIFICAR RESULTADOS</span>
          </div>
          <div className="p-5 space-y-4">
            <p className="text-sm" style={{ color: 'var(--mundial-muted)' }}>
              Revisa todos los partidos con deadline vencido, resuelve los finalizados y premia a los usuarios correctos.
            </p>

            <motion.button
              onClick={handleResolveAll}
              disabled={resolving}
              whileHover={!resolving ? { scale: 1.02 } : {}}
              whileTap={!resolving ? { scale: 0.98 } : {}}
              className="w-full flex items-center justify-center gap-2.5 py-4 rounded-xl text-sm font-black"
              style={{
                background: resolving ? 'rgba(34,197,94,0.30)' : '#22c55e',
                color: '#fff',
                cursor: resolving ? 'not-allowed' : 'pointer',
                boxShadow: resolving ? 'none' : '0 4px 20px rgba(34,197,94,0.30)',
              }}
            >
              {resolving
                ? <><Loader2 className="h-4 w-4 animate-spin" />Verificando...</>
                : <><RefreshCw className="h-4 w-4" />Verificar Resultados Automáticamente</>}
            </motion.button>

            {/* Last result */}
            {lastChecked && (
              <div
                className="rounded-xl px-4 py-3 space-y-1 text-xs"
                style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.18)' }}
              >
                <p style={{ color: 'rgba(255,255,255,0.50)' }}>
                  Última verificación: <span style={{ color: '#22c55e' }}>{formatDistanceToNow(lastChecked, { locale: es, addSuffix: true })}</span>
                </p>
                {lastResult && (
                  <p style={{ color: 'rgba(255,255,255,0.50)' }}>
                    Revisados: <strong style={{ color: '#fff' }}>{lastResult.checked}</strong> ·
                    Resueltos: <strong style={{ color: '#22c55e' }}>{lastResult.resolved}</strong> ·
                    Usuarios premiados: <strong style={{ color: '#FFD700' }}>{lastResult.usersAwarded}</strong>
                  </p>
                )}
              </div>
            )}

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Total partidos', value: predictions.length, color: '#a78bfa' },
                { label: 'Pendientes', value: pending.length, color: '#f59e0b' },
                { label: 'Resueltos', value: totalResolved, color: '#22c55e' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex flex-col items-center py-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <span className="text-xl font-black" style={{ color }}>{value}</span>
                  <span className="text-xs mt-0.5" style={{ color: 'var(--mundial-muted)' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pending matches list */}
        {pending.length > 0 && (
          <div style={CARD}>
            <div className="px-5 py-3" style={{ background: 'var(--mundial-header-bg)', borderBottom: '1px solid var(--mundial-header-border)' }}>
              <span className="text-sm font-black tracking-wider" style={{ color: '#f59e0b' }}>
                ⏳ PENDIENTES DE RESOLVER ({pending.length})
              </span>
            </div>
            <div>
              {pending.map((pred, i) => {
                const opts = Array.isArray(pred.options) ? (pred.options as string[]) : []
                const homeTeam = opts[0] ?? ''
                const awayTeam = opts[2] ?? ''
                const homeFlag = getFlagUrl(pred.home_team_code)
                const awayFlag = getFlagUrl(pred.away_team_code)
                const stage = STAGE_LABELS[parseStage(pred.description)] ?? ''
                const status = STATUS_BADGE[pred.status]

                return (
                  <div
                    key={pred.id}
                    className="px-5 py-4"
                    style={{ borderTop: i > 0 ? '1px solid var(--mundial-header-border)' : 'none' }}
                  >
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      {/* Teams */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          {homeFlag && <img src={homeFlag} alt={homeTeam} style={{ height: 16, width: 'auto' }} />}
                          <span className="text-sm font-semibold" style={{ color: '#fff' }}>{homeTeam}</span>
                          <span className="text-xs" style={{ color: 'var(--mundial-muted)' }}>vs</span>
                          <span className="text-sm font-semibold" style={{ color: '#fff' }}>{awayTeam}</span>
                          {awayFlag && <img src={awayFlag} alt={awayTeam} style={{ height: 16, width: 'auto' }} />}
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: status.bg, color: status.color, border: `1px solid ${status.border}` }}>
                            {status.label}
                          </span>
                        </div>
                        <p className="text-xs" style={{ color: 'var(--mundial-muted)' }}>
                          {stage && `${stage} · `}📅 {format(new Date(pred.deadline), 'dd/MM HH:mm')} · 👥 {pred.responseCount}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleVerify(pred)}
                          disabled={verifying[pred.id]}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                          style={{
                            background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.22)',
                            color: '#22c55e', cursor: verifying[pred.id] ? 'not-allowed' : 'pointer',
                          }}
                        >
                          {verifying[pred.id]
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <RefreshCw className="h-3.5 w-3.5" />}
                          {verifying[pred.id] ? 'Verificando...' : 'Verificar'}
                        </button>

                        {deleteId === pred.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(pred.id)}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-medium"
                              style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.28)', color: '#f87171', cursor: 'pointer' }}
                            >Sí</button>
                            <button
                              onClick={() => setDeleteId(null)}
                              className="px-2.5 py-1.5 rounded-lg text-xs"
                              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.50)', cursor: 'pointer' }}
                            >No</button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteId(pred.id)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs"
                            style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.16)', color: '#f87171', cursor: 'pointer' }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* All matches (resolved) — collapsed count */}
        {!loading && pending.length === 0 && (
          <div
            className="rounded-xl px-5 py-4 text-center text-sm"
            style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.18)', color: '#22c55e' }}
          >
            ✓ No hay partidos pendientes de resolver
          </div>
        )}
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast.visible && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 500, damping: 32 }}
            className="fixed bottom-6 right-6 z-[10000] flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium max-w-sm"
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
