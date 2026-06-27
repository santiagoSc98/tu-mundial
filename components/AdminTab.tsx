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
type UserActivity = {
  id: string
  username: string | null
  avatar_url: string | null
  last_seen_at: string | null
  total_points: number
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Nunca'
  const date = new Date(dateStr.includes('Z') ? dateStr : dateStr + 'Z')
  const diffMs = Date.now() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  console.log('[timeAgo]', dateStr, '→', diffMin, 'minutos')
  if (diffMin < 1) return 'ahora'
  if (diffMin < 60) return `hace ${diffMin}m`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `hace ${diffH}h`
  const diffD = Math.floor(diffH / 24)
  return `hace ${diffD}d`
}

const STATUS_BADGE: Record<string, { label: string; color: string; bg: string; border: string }> = {
  open:     { label: 'Abierta',  color: '#22c55e', bg: 'rgba(34,197,94,0.10)',   border: 'rgba(34,197,94,0.25)' },
  closed:   { label: 'Cerrada',  color: '#f59e0b', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.25)' },
  resolved: { label: 'Resuelta', color: '#a78bfa', bg: 'rgba(139,92,246,0.10)', border: 'rgba(139,92,246,0.25)' },
}

const STAGE_LABELS: Record<string, string> = {
  GROUP_STAGE: 'Grupos', LAST_32: 'Dieciseisavos', LAST_16: 'Octavos', ROUND_OF_16: 'Octavos',
  QUARTER_FINALS: 'Cuartos', SEMI_FINALS: 'Semis', THIRD_PLACE: '3er Puesto', FINAL: 'Final',
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
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [usersActivity, setUsersActivity] = useState<UserActivity[]>([])
  const [loadingActivity, setLoadingActivity] = useState(true)
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

  const fetchUsersActivity = async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from('profiles')
      .select('id, username, avatar_url, last_seen_at, total_points')
      .order('last_seen_at', { ascending: false, nullsFirst: false })
    setUsersActivity(data ?? [])
    setLoadingActivity(false)
  }

  useEffect(() => { fetchPredictions(); fetchUsersActivity() }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-montserrat, system-ui)', margin: 0, marginBottom: 4, letterSpacing: '-0.01em' }}>
            Admin
          </h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.40)', margin: 0 }}>
            Solo visible para administradores
          </p>
        </div>

        {/* Info banner — full width */}
        <div
          className="rounded-xl px-4 py-3 text-sm mb-5"
          style={{ background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.20)', color: 'rgba(255,255,255,0.55)' }}
        >
          🤖 El sistema resuelve partidos automáticamente cada 5 minutos. Esta sección es solo para casos excepcionales.
        </div>

        {/* 2-column grid on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">

          {/* ── LEFT COLUMN ── */}
          <div className="space-y-4">

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
                        Premiados: <strong style={{ color: '#FFD700' }}>{lastResult.usersAwarded}</strong>
                      </p>
                    )}
                  </div>
                )}

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Total', value: predictions.length, color: '#a78bfa' },
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
                        <div className="flex items-center justify-between gap-3">
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

                          {/* Delete action */}
                          <div className="flex items-center gap-2 shrink-0">
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

            {!loading && pending.length === 0 && (
              <div
                className="rounded-xl px-5 py-4 text-center text-sm"
                style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.18)', color: '#22c55e' }}
              >
                ✓ No hay partidos pendientes de resolver
              </div>
            )}
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="space-y-4">

            {/* User activity */}
            <div style={CARD}>
              <div className="px-5 py-3" style={{ background: 'var(--mundial-header-bg)', borderBottom: '1px solid var(--mundial-header-border)' }}>
                <span className="text-sm font-black tracking-wider" style={{ color: '#0052A5' }}>ACTIVIDAD DE USUARIOS</span>
              </div>
              <div className="p-5">
                {loadingActivity ? (
                  <p className="text-sm text-center py-4" style={{ color: 'var(--mundial-muted)' }}>Cargando...</p>
                ) : (
                  <>
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr>
                          {['USUARIO', 'ÚLTIMA VISITA', 'PTS'].map((h, i) => (
                            <th key={h} className={`pb-2 ${i === 0 ? 'text-left' : 'text-right'}`}
                              style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', color: 'rgba(255,255,255,0.35)' }}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {usersActivity.map(u => {
                          const ago = timeAgo(u.last_seen_at)
                          const never    = !u.last_seen_at
                          const inactive = !never && (Date.now() - new Date(u.last_seen_at!).getTime()) > 3 * 24 * 3600_000
                          const timeColor = never ? '#ef4444' : inactive ? '#f97316' : 'rgba(255,255,255,0.65)'
                          return (
                            <tr key={u.id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                              <td className="py-2 pr-3">
                                <div className="flex items-center gap-2">
                                  {u.avatar_url ? (
                                    <img src={u.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
                                  ) : (
                                    <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white"
                                      style={{ background: 'rgba(255,255,255,0.1)' }}>
                                      {(u.username ?? '?')[0].toUpperCase()}
                                    </div>
                                  )}
                                  <span className="truncate" style={{ color: '#fff', fontWeight: 500 }}>{u.username ?? 'Anónimo'}</span>
                                </div>
                              </td>
                              <td className="py-2 text-right" style={{ color: timeColor, fontWeight: 600, whiteSpace: 'nowrap' }}>
                                {ago}
                              </td>
                              <td className="py-2 text-right" style={{ color: 'rgba(255,255,255,0.55)' }}>
                                {u.total_points}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                    <div className="flex items-center gap-4 mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.40)' }}>
                        <span style={{ color: '#f97316' }}>● </span>3+ días inactivo
                      </span>
                      <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.40)' }}>
                        <span style={{ color: '#ef4444' }}>● </span>nunca entró
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Advanced tools toggle + import */}
            <div>
              <button
                onClick={() => setShowAdvanced(v => !v)}
                className="flex items-center gap-2 text-xs font-semibold mb-3"
                style={{ color: 'rgba(255,255,255,0.35)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                <span style={{ transition: 'transform 0.2s', display: 'inline-block', transform: showAdvanced ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
                {showAdvanced ? 'Ocultar herramientas avanzadas' : 'Mostrar herramientas avanzadas'}
              </button>

              {showAdvanced && (
                <div style={CARD}>
                  <div className="px-5 py-3" style={{ background: 'var(--mundial-header-bg)', borderBottom: '1px solid var(--mundial-header-border)' }}>
                    <span className="text-sm font-black tracking-wider" style={{ color: '#0052A5' }}>IMPORTAR PLANTELES</span>
                  </div>
                  <div className="p-5 space-y-4">
                    <p className="text-sm" style={{ color: 'var(--mundial-muted)' }}>
                      Descarga los planteles del Mundial 2026 desde Football-Data.org. Puede tardar varios minutos (límite de 10 req/min en el plan gratuito).
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
              )}
            </div>

          </div>
        </div>
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
