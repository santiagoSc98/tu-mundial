'use client'

import { useMemo, useState, useEffect } from 'react'
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import { getFlagUrl } from '@/lib/flagCodes'
import { pyTime, getTeamNameES } from '@/lib/worldcup'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Database } from '@/lib/database.types'

// ─── Constants ────────────────────────────────────────────────────────────────

const ITEMS_PER_PAGE = 10

const SCORE_BTN: React.CSSProperties = {
  width: 32, height: 32, borderRadius: 8,
  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
  color: '#fff', fontSize: 18, fontWeight: 700, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
}

const STAGE_LABELS: Record<string, string> = {
  GROUP_STAGE:    'Grupos',
  LAST_32:        'Dieciseisavos',
  LAST_16:        'Octavos',
  ROUND_OF_16:    'Octavos',
  QUARTER_FINALS: 'Cuartos',
  SEMI_FINALS:    'Semis',
  THIRD_PLACE:    '3er Puesto',
  FINAL:          'Final',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function deduceResult(home: number, away: number, homeTeam: string, awayTeam: string, draw: string) {
  if (home > away) return homeTeam
  if (away > home) return awayTeam
  return draw
}

type Prediction = Database['public']['Tables']['predictions']['Row']
type Filter = 'todas' | 'acertadas' | 'falladas' | 'pendientes'

function getStage(description: string | null): string {
  const key = description?.match(/Fase: ([A-Z_]+)/)?.[1] ?? ''
  return STAGE_LABELS[key] ?? ''
}

function getKickoff(p: Prediction): Date {
  const d = new Date((p.deadline ?? '') as string)
  return new Date(d.getTime() + 10 * 60 * 1000)
}

function getOptions(options: unknown): [string, string, string] {
  const opts = Array.isArray(options) ? (options as string[]) : []
  return [opts[0] ?? '', opts[1] ?? 'Empate', opts[2] ?? '']
}

function WhatsAppIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
    </svg>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  predictions: Prediction[]
  existingAnswers: Record<string, string>
  existingScores: Record<string, { home: number; away: number }>
  existingVotes?: Record<string, { isCorrect: boolean | null; pointsEarned: number | null }>
  onTabChange?: (tab: string) => void
  backTab?: string
  onPredict?: (predictionId: string, answer: string, homeScore: number, awayScore: number) => Promise<void>
  rank?: number
  points?: number
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MisPrediccionesTab({
  predictions, existingAnswers, existingScores, existingVotes,
  onTabChange, backTab = 'inicio', onPredict, rank, points,
}: Props) {
  const [filter,      setFilter]      = useState<Filter>('todas')
  const [editingId,   setEditingId]   = useState<string | null>(null)
  const [editHome,    setEditHome]    = useState(0)
  const [editAway,    setEditAway]    = useState(0)
  const [submitting,  setSubmitting]  = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => setCurrentPage(1), [filter])

  // ── Edit helpers ────────────────────────────────────────────────────────────
  const openEdit = (p: Prediction) => {
    const s = existingScores[p.id]
    setEditHome(s?.home ?? 0)
    setEditAway(s?.away ?? 0)
    setEditingId(p.id)
  }
  const closeEdit = () => setEditingId(null)

  const handleSave = async (p: Prediction, homeTeam: string, awayTeam: string, draw: string) => {
    if (!onPredict || submitting) return
    const answer = deduceResult(editHome, editAway, homeTeam, awayTeam, draw)
    setSubmitting(true)
    closeEdit()
    await onPredict(p.id, answer, editHome, editAway)
    setSubmitting(false)
  }

  // ── Derived data ────────────────────────────────────────────────────────────
  const myPredictions = useMemo(
    () => predictions.filter(p => existingAnswers[p.id] !== undefined),
    [predictions, existingAnswers]
  )

  const dbIsCorrect = (p: Prediction): boolean | null => {
    const v = existingVotes?.[p.id]
    if (v) return v.isCorrect
    return p.status === 'resolved' ? existingAnswers[p.id] === p.correct_answer : null
  }

  const stats = useMemo(() => {
    const resolved = myPredictions.filter(p => p.status === 'resolved')
    const exactos  = resolved.filter(p => (existingVotes?.[p.id]?.pointsEarned ?? 0) >= 8).length
    const correctos = resolved.filter(p => {
      const pts = existingVotes?.[p.id]?.pointsEarned ?? 0
      return pts > 0 && pts < 8
    }).length
    const fallados = resolved.filter(p => dbIsCorrect(p) === false).length
    const totalPuntos = myPredictions.reduce((sum, p) => sum + (existingVotes?.[p.id]?.pointsEarned ?? 0), 0)
    return {
      total: myPredictions.length,
      exactos,
      correctos,
      fallados,
      pending: myPredictions.filter(p => p.status !== 'resolved').length,
      totalPuntos,
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myPredictions, existingAnswers, existingVotes])

  const filtered = useMemo(() => {
    switch (filter) {
      case 'acertadas':  return myPredictions.filter(p => p.status === 'resolved' && dbIsCorrect(p) === true)
      case 'falladas':   return myPredictions.filter(p => p.status === 'resolved' && dbIsCorrect(p) === false)
      case 'pendientes': return myPredictions.filter(p => p.status !== 'resolved')
      default:           return myPredictions
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myPredictions, existingAnswers, existingVotes, filter])

  const sorted = useMemo(
    () => [...filtered].sort((a, b) => {
      const aOpen = a.status !== 'resolved' ? 0 : 1
      const bOpen = b.status !== 'resolved' ? 0 : 1
      if (aOpen !== bOpen) return aOpen - bOpen
      return new Date(b.deadline ?? 0).getTime() - new Date(a.deadline ?? 0).getTime()
    }),
    [filtered]
  )

  const totalPages  = Math.ceil(sorted.length / ITEMS_PER_PAGE)
  const paginated   = sorted.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const FILTERS: [Filter, string][] = [
    ['todas',      `Todas (${stats.total})`],
    ['acertadas',  'Acertadas ✅'],
    ['falladas',   'Falladas ❌'],
    ['pendientes', 'Pendientes ⏳'],
  ]

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-5">
        {onTabChange ? (
          <button
            onClick={() => onTabChange(backTab)}
            className="flex items-center gap-1.5 text-sm text-gray-400 px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/[0.04] transition"
            style={{ cursor: 'pointer', background: 'transparent' }}
          >
            <ArrowLeft size={14} />
            {backTab === 'perfil' ? 'Mi Perfil' : 'Volver'}
          </button>
        ) : <div />}
        <div className="text-right">
          <h2 className="text-xl font-medium text-white">Mis predicciones</h2>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.40)' }}>
            {stats.total} predicciones · {stats.exactos + stats.correctos} acertadas
            {stats.pending > 0 ? ` · ${stats.pending} pendiente${stats.pending > 1 ? 's' : ''}` : ''}
          </p>
        </div>
      </div>

      {/* ── Stats tiles ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-2.5 mb-4">
        {[
          { val: stats.exactos,    label: 'Exactos +8',  color: '#00C46A' },
          { val: stats.correctos,  label: 'Correctos +3', color: '#60a5fa' },
          { val: stats.fallados,   label: 'Fallados',    color: 'rgba(255,255,255,0.30)' },
          { val: stats.totalPuntos, label: 'Puntos',     color: '#F6B73C' },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <div className="text-xl font-medium" style={{ color: s.color }}>{s.val}</div>
            <div className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Filter pills ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 mb-4 flex-wrap">
        {FILTERS.map(([id, label]) => (
          <button
            key={id}
            onClick={() => setFilter(id)}
            className="px-3.5 py-1.5 rounded-full text-xs border transition whitespace-nowrap"
            style={{
              background: filter === id ? 'rgba(0,106,51,0.20)' : 'transparent',
              borderColor: filter === id ? 'rgba(0,106,51,0.40)' : 'rgba(255,255,255,0.10)',
              color: filter === id ? '#00C46A' : 'rgba(255,255,255,0.45)',
              cursor: 'pointer',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── List ────────────────────────────────────────────────────────── */}
      {sorted.length === 0 ? (
        <div className="text-center py-16">
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.30)' }}>
            {stats.total === 0 ? 'Todavía no hiciste ninguna predicción' : 'No hay predicciones en esta categoría'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {paginated.map(p => {
            const answered   = existingAnswers[p.id]
            const score      = existingScores[p.id]
            const isFootball = !!(p.home_team_code && p.away_team_code)
            const [homeRaw,, awayRaw] = getOptions(p.options)
            const home     = getTeamNameES(homeRaw)
            const away     = getTeamNameES(awayRaw)
            const homeFlag = getFlagUrl(p.home_team_code)
            const awayFlag = getFlagUrl(p.away_team_code)
            const ko       = getKickoff(p)
            const stage    = getStage(p.description)

            const isResolved = p.status === 'resolved'
            const isCorrect  = isResolved && (dbIsCorrect(p) === true)
            const isFailed   = isResolved && (dbIsCorrect(p) === false)
            const canEdit    = onPredict && !isResolved && new Date() < new Date((p.deadline ?? 0) as string)
            const isEditing  = editingId === p.id

            const ptsEarned  = existingVotes?.[p.id]?.pointsEarned ?? 0
            const pronóstico = score ? `${answered} ${score.home}–${score.away}` : answered

            // Row border/bg color
            const rowBorderColor = !isResolved
              ? 'rgba(246,183,60,0.25)'
              : isCorrect ? 'rgba(34,197,94,0.18)'
              : isFailed  ? 'rgba(248,113,113,0.18)'
              : 'rgba(255,255,255,0.08)'
            const rowBg = !isResolved
              ? 'rgba(246,183,60,0.04)'
              : isCorrect ? 'rgba(34,197,94,0.04)'
              : isFailed  ? 'rgba(248,113,113,0.04)'
              : 'rgba(255,255,255,0.03)'

            // Points badge style
            const badgeStyle = ptsEarned >= 8
              ? { bg: 'rgba(0,196,106,0.15)', color: '#00C46A',   border: 'rgba(0,196,106,0.25)' }
              : ptsEarned > 0
              ? { bg: 'rgba(59,130,246,0.15)', color: '#60a5fa',  border: 'rgba(59,130,246,0.25)' }
              : !isResolved
              ? { bg: 'rgba(246,183,60,0.15)', color: '#F6B73C',  border: 'rgba(246,183,60,0.25)' }
              : { bg: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.30)', border: 'rgba(255,255,255,0.10)' }

            return (
              <div
                key={p.id}
                className="rounded-xl transition"
                style={{ border: `1px solid ${rowBorderColor}`, background: rowBg }}
              >
                {/* ── Compact row ─────────────────────────────────── */}
                <div
                  className="grid items-center gap-2 px-4 py-3"
                  style={{ gridTemplateColumns: '1fr auto auto auto auto' }}
                >
                  {/* Left: flags + info */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    {isFootball && (
                      <div className="flex gap-0.5 flex-shrink-0">
                        {homeFlag && <img src={homeFlag} alt="" className="w-5 h-3.5 rounded-sm object-cover" />}
                        {awayFlag && <img src={awayFlag} alt="" className="w-5 h-3.5 rounded-sm object-cover" />}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {isFootball ? `${home} vs ${away}` : (p.title ?? '')}
                      </p>
                      <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                        {format(ko, "d MMM", { locale: es }).toUpperCase()} · {pyTime(ko)}{stage ? ` · ${stage}` : ''}
                      </p>
                    </div>
                  </div>

                  {/* Mi pronóstico */}
                  <div className="text-xs text-right whitespace-nowrap" style={{ color: 'rgba(255,255,255,0.55)' }}>
                    {pronóstico}
                  </div>

                  {/* Resultado */}
                  <div className="text-xs text-center whitespace-nowrap w-12" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    {isResolved
                      ? (p as { exact_score_home?: number | null }).exact_score_home != null
                        ? `${(p as { exact_score_home?: number | null }).exact_score_home}–${(p as { exact_score_away?: number | null }).exact_score_away}`
                        : (p.correct_answer ?? '—')
                      : 'Pend.'}
                  </div>

                  {/* Points badge */}
                  <span
                    className="inline-flex items-center justify-center min-w-[44px] px-2 py-1 rounded-full text-xs font-medium"
                    style={{ background: badgeStyle.bg, color: badgeStyle.color, border: `1px solid ${badgeStyle.border}` }}
                  >
                    {!isResolved ? 'Pend.' : `+${ptsEarned}`}
                  </span>

                  {/* Editar button or spacer */}
                  {canEdit && !isEditing ? (
                    <button
                      onClick={() => openEdit(p)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] transition whitespace-nowrap"
                      style={{ border: '1px solid rgba(246,183,60,0.30)', color: '#F6B73C', background: 'rgba(246,183,60,0.08)', cursor: 'pointer' }}
                    >
                      Editar
                    </button>
                  ) : (
                    <div className="w-14" />
                  )}
                </div>

                {/* ── Inline editor ───────────────────────────────── */}
                {isEditing && (
                  <div className="px-4 pb-4">
                    <div style={{ background: 'rgba(0,0,0,0.18)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '14px 16px' }}>
                      <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.40)', textTransform: 'uppercase' }}>
                        Cambiar predicción
                      </p>

                      {isFootball ? (
                        <>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 12 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                {homeFlag && <img src={homeFlag} alt={home} style={{ width: 28, height: 19, objectFit: 'cover', borderRadius: 3 }} />}
                                <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{home}</span>
                              </div>
                              <span style={{ fontSize: 36, fontWeight: 900, color: '#fff', lineHeight: 1, fontFamily: 'var(--font-montserrat, system-ui)' }}>{editHome}</span>
                              <div style={{ display: 'flex', gap: 6 }}>
                                <button style={SCORE_BTN} onClick={() => setEditHome(s => Math.max(0, s - 1))}>−</button>
                                <button style={SCORE_BTN} onClick={() => setEditHome(s => Math.min(9, s + 1))}>+</button>
                              </div>
                            </div>
                            <span style={{ fontSize: 28, fontWeight: 900, color: 'rgba(255,255,255,0.25)', fontFamily: 'var(--font-montserrat, system-ui)' }}>:</span>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{away}</span>
                                {awayFlag && <img src={awayFlag} alt={away} style={{ width: 28, height: 19, objectFit: 'cover', borderRadius: 3 }} />}
                              </div>
                              <span style={{ fontSize: 36, fontWeight: 900, color: '#fff', lineHeight: 1, fontFamily: 'var(--font-montserrat, system-ui)' }}>{editAway}</span>
                              <div style={{ display: 'flex', gap: 6 }}>
                                <button style={SCORE_BTN} onClick={() => setEditAway(s => Math.max(0, s - 1))}>−</button>
                                <button style={SCORE_BTN} onClick={() => setEditAway(s => Math.min(9, s + 1))}>+</button>
                              </div>
                            </div>
                          </div>
                          {(() => {
                            const [homeRaw2, draw2, awayRaw2] = getOptions(p.options)
                            const h2 = getTeamNameES(homeRaw2), a2 = getTeamNameES(awayRaw2)
                            const predicted = deduceResult(editHome, editAway, h2, a2, draw2)
                            return (
                              <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.45)', margin: '0 0 12px' }}>
                                Ganará: <strong style={{ color: '#fff' }}>{predicted}</strong>
                              </p>
                            )
                          })()}
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={closeEdit} style={{ flex: 1, padding: '9px', borderRadius: 10, background: 'transparent', border: '1px solid rgba(255,255,255,0.10)', cursor: 'pointer', color: 'rgba(255,255,255,0.50)', fontSize: 13, fontWeight: 600 }}>
                              Cancelar
                            </button>
                            <button
                              onClick={() => {
                                const [homeRaw2, draw2, awayRaw2] = getOptions(p.options)
                                handleSave(p, getTeamNameES(homeRaw2), getTeamNameES(awayRaw2), draw2)
                              }}
                              style={{ flex: 1, padding: '9px', borderRadius: 10, background: '#006A33', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 13, fontWeight: 700 }}
                            >
                              Guardar cambio
                            </button>
                          </div>
                        </>
                      ) : (
                        <div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                            {getOptions(p.options).filter(Boolean).map(opt => (
                              <button
                                key={opt}
                                onClick={async () => {
                                  if (!onPredict || submitting) return
                                  setSubmitting(true)
                                  closeEdit()
                                  await onPredict(p.id, opt, 0, 0)
                                  setSubmitting(false)
                                }}
                                style={{ padding: '10px 14px', borderRadius: 10, border: `1px solid ${answered === opt ? 'rgba(0,106,51,0.60)' : 'rgba(255,255,255,0.10)'}`, background: answered === opt ? 'rgba(0,106,51,0.20)' : 'rgba(255,255,255,0.05)', color: answered === opt ? '#4ade80' : '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                          <button onClick={closeEdit} style={{ width: '100%', padding: '9px', borderRadius: 10, background: 'transparent', border: '1px solid rgba(255,255,255,0.10)', cursor: 'pointer', color: 'rgba(255,255,255,0.50)', fontSize: 13, fontWeight: 600 }}>
                            Cancelar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── WhatsApp share (resolved only) ──────────────── */}
                {isResolved && (
                  <div className="px-4 pb-3 flex justify-end">
                    <button
                      onClick={() => {
                        const result    = isCorrect ? 'Acerté' : 'Fallé'
                        const matchLine = isFootball
                          ? `${home} vs ${away}: pronostiqué ${pronóstico}`
                          : `"${p.title}": pronostiqué ${pronóstico}`
                        const rankLine = rank ? `Estoy #${rank}${points !== undefined ? ` con ${points} pts` : ''} en TU MUNDIAL.` : 'Jugá conmigo en TU MUNDIAL.'
                        const text = `${result} en mi predicción 🏆\n${matchLine}\n${rankLine}\n¿Podés superarme? tu-mundial.vercel.app`
                        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
                      }}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 8, background: '#25D366', color: '#fff', border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                    >
                      <WhatsAppIcon /> Compartir
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Pagination ──────────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-5 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
            {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, sorted.length)} de {sorted.length}
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg border transition"
              style={{ borderColor: 'rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.45)', background: 'transparent', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.3 : 1 }}
            >
              <ChevronLeft size={14} />
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className="w-8 h-8 flex items-center justify-center rounded-lg border text-xs transition"
                style={{
                  background:   currentPage === page ? '#006A33' : 'transparent',
                  borderColor:  currentPage === page ? '#006A33' : 'rgba(255,255,255,0.10)',
                  color:        currentPage === page ? '#fff'    : 'rgba(255,255,255,0.45)',
                  cursor: 'pointer',
                }}
              >
                {page}
              </button>
            ))}

            {totalPages > 5 && (
              <>
                <span className="text-xs px-1" style={{ color: 'rgba(255,255,255,0.25)' }}>…</span>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border text-xs transition"
                  style={{
                    background:  currentPage === totalPages ? '#006A33' : 'transparent',
                    borderColor: currentPage === totalPages ? '#006A33' : 'rgba(255,255,255,0.10)',
                    color:       currentPage === totalPages ? '#fff'    : 'rgba(255,255,255,0.45)',
                    cursor: 'pointer',
                  }}
                >
                  {totalPages}
                </button>
              </>
            )}

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="w-8 h-8 flex items-center justify-center rounded-lg border transition"
              style={{ borderColor: 'rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.45)', background: 'transparent', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.3 : 1 }}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
