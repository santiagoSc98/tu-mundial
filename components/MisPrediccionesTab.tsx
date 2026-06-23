'use client'

import { useMemo, useState } from 'react'
import { CheckCircle, XCircle, Clock, ArrowLeft } from 'lucide-react'
import { getFlagUrl } from '@/lib/flagCodes'
import { pyTime, getTeamNameES } from '@/lib/worldcup'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Database } from '@/lib/database.types'

const SCORE_BTN: React.CSSProperties = {
  width: 32, height: 32, borderRadius: 8,
  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
  color: '#fff', fontSize: 18, fontWeight: 700, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
}

function deduceResult(home: number, away: number, homeTeam: string, awayTeam: string, draw: string) {
  if (home > away) return homeTeam
  if (away > home) return awayTeam
  return draw
}

type Prediction = Database['public']['Tables']['predictions']['Row']
type Filter = 'todas' | 'acertadas' | 'falladas' | 'pendientes'

const STAGE_LABELS: Record<string, string> = {
  GROUP_STAGE:    'Grupos',
  LAST_16:        'Dieciseisavos',
  ROUND_OF_16:    'Octavos',
  QUARTER_FINALS: 'Cuartos',
  SEMI_FINALS:    'Semis',
  THIRD_PLACE:    '3er Puesto',
  FINAL:          'Final',
}

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

interface Props {
  predictions: Prediction[]
  existingAnswers: Record<string, string>
  existingScores: Record<string, { home: number; away: number }>
  existingVotes?: Record<string, { isCorrect: boolean | null; pointsEarned: number | null }>
  onTabChange?: (tab: string) => void
  onPredict?: (predictionId: string, answer: string, homeScore: number, awayScore: number) => Promise<void>
  rank?: number
  points?: number
}

export default function MisPrediccionesTab({ predictions, existingAnswers, existingScores, existingVotes, onTabChange, onPredict, rank, points }: Props) {
  const [filter, setFilter] = useState<Filter>('todas')
  const [editingId,  setEditingId]  = useState<string | null>(null)
  const [editHome,   setEditHome]   = useState(0)
  const [editAway,   setEditAway]   = useState(0)
  const [submitting, setSubmitting] = useState(false)

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
    return {
      total:   myPredictions.length,
      correct: resolved.filter(p => dbIsCorrect(p) === true).length,
      pending: myPredictions.filter(p => p.status !== 'resolved').length,
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

  const CARD: React.CSSProperties = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 20,
  }

  const FILTERS: [Filter, string][] = [
    ['todas',      `Todas (${stats.total})`],
    ['acertadas',  'Acertadas ✅'],
    ['falladas',   'Falladas ❌'],
    ['pendientes', 'Pendientes ⏳'],
  ]

  return (
    <div>
      {onTabChange && (
        <button
          onClick={() => onTabChange('perfil')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.45)', fontSize: 13, padding: '0 0 20px', transition: 'color 0.15s' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}
        >
          <ArrowLeft size={15} /> Mi Perfil
        </button>
      )}
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-montserrat, system-ui)', margin: 0, marginBottom: 4, letterSpacing: '-0.01em' }}>
          Mis Predicciones
        </h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.40)', margin: 0 }}>
          Tu historial de predicciones
        </p>
      </div>

      {/* ── Stats row ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { value: stats.total,   label: 'PREDICCIONES', color: '#60a5fa' },
          { value: stats.correct, label: 'ACERTADAS',    color: '#22c55e' },
          { value: stats.pending, label: 'PENDIENTES',   color: '#F6B73C' },
        ].map(s => (
          <div key={s.label} style={{ ...CARD, padding: '16px 12px', textAlign: 'center' }}>
            <p style={{ fontSize: 28, fontWeight: 800, color: s.color, fontFamily: 'var(--font-montserrat, system-ui)', margin: '0 0 4px', lineHeight: 1 }}>
              {s.value}
            </p>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', color: 'rgba(255,255,255,0.35)', margin: 0 }}>
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* ── Filter pills ───────────────────────────────────────────────── */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {FILTERS.map(([id, label]) => (
          <button
            key={id}
            onClick={() => setFilter(id)}
            className="px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap shrink-0"
            style={{
              background: filter === id ? '#006A33' : 'rgba(255,255,255,0.06)',
              color:      filter === id ? '#fff'    : 'rgba(255,255,255,0.55)',
              border:     'none',
              cursor:     'pointer',
              transition: 'background 0.15s, color 0.15s',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Prediction list ────────────────────────────────────────────── */}
      {sorted.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0' }}>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.30)' }}>
            {stats.total === 0
              ? 'Todavía no hiciste ninguna predicción'
              : 'No hay predicciones en esta categoría'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sorted.map(p => {
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

            const STATUS = isCorrect
              ? { icon: <CheckCircle style={{ width: 20, height: 20, color: '#22c55e' }} />,                          color: '#22c55e',               bg: 'rgba(34,197,94,0.07)',    border: 'rgba(34,197,94,0.18)'    }
              : isFailed
              ? { icon: <XCircle    style={{ width: 20, height: 20, color: '#f87171' }} />,                          color: '#f87171',               bg: 'rgba(248,113,113,0.07)',  border: 'rgba(248,113,113,0.18)'  }
              : { icon: <Clock      style={{ width: 20, height: 20, color: 'rgba(255,255,255,0.28)' }} />,           color: 'rgba(255,255,255,0.55)', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)'  }

            const pronóstico = score
              ? `${answered} ${score.home}–${score.away}`
              : answered

            return (
              <div
                key={p.id}
                style={{ background: STATUS.bg, border: `1px solid ${STATUS.border}`, borderRadius: 20, padding: '16px 20px' }}
              >
                {/* Match info + status icon */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {isFootball ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                        {homeFlag && <img src={homeFlag} alt={home} style={{ width: 22, height: 15, objectFit: 'cover', borderRadius: 3, flexShrink: 0 }} />}
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{home}</span>
                        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>vs</span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{away}</span>
                        {awayFlag && <img src={awayFlag} alt={away} style={{ width: 22, height: 15, objectFit: 'cover', borderRadius: 3, flexShrink: 0 }} />}
                      </div>
                    ) : (
                      <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: 0 }}>{p.title}</p>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
                      {stage && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{stage}</span>}
                      {stage && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.18)' }}>·</span>}
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
                        {format(ko, "d MMM", { locale: es }).toUpperCase()} · {pyTime(ko)}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                    {STATUS.icon}
                    {isCorrect && (
                      <span style={{ fontSize: 11, fontWeight: 800, color: '#22c55e' }}>
                        +{existingVotes?.[p.id]?.pointsEarned ?? 3} pts
                      </span>
                    )}
                  </div>
                </div>

                {/* Pronóstico */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', background: 'rgba(0,0,0,0.12)', borderRadius: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.40)', flexShrink: 0 }}>Tu pronóstico:</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: STATUS.color }}>{pronóstico}</span>
                  {canEdit && !isEditing && (
                    <button
                      onClick={() => openEdit(p)}
                      style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 8, background: 'rgba(246,183,60,0.12)', border: '1px solid rgba(246,183,60,0.25)', color: '#F6B73C', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                    >
                      Editar
                    </button>
                  )}
                </div>

                {/* Inline editor */}
                {isEditing && (
                  <div style={{ background: 'rgba(0,0,0,0.18)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '14px 16px', marginBottom: 8 }}>
                    <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.40)', textTransform: 'uppercase' }}>
                      Cambiar predicción
                    </p>

                    {isFootball ? (
                      <>
                        {/* Compact score picker */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 12 }}>
                          {/* Home */}
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

                          {/* Away */}
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

                        {/* Result preview */}
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
                      /* Non-football: option buttons */
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
                )}

                {/* Resultado */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 4 }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', flexShrink: 0 }}>Resultado:</span>
                  {isResolved ? (
                    <span style={{ fontSize: 12, fontWeight: 600, color: isCorrect ? '#22c55e' : '#f87171' }}>
                      {p.correct_answer ?? '—'}
                      {(p as { exact_score_home?: number | null }).exact_score_home != null && (
                        <span style={{ fontWeight: 400, color: 'rgba(255,255,255,0.45)', marginLeft: 4 }}>
                          {(p as { exact_score_home?: number | null }).exact_score_home}–{(p as { exact_score_away?: number | null }).exact_score_away}
                        </span>
                      )}
                    </span>
                  ) : (
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>Pendiente</span>
                  )}
                </div>

                {/* Compartir (solo predicciones resueltas) */}
                {isResolved && (
                  <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => {
                        const result = isCorrect ? 'Acerté' : 'Fallé'
                        const matchLine = isFootball
                          ? `${home} vs ${away}: pronostiqué ${pronóstico}`
                          : `"${p.title}": pronostiqué ${pronóstico}`
                        const rankLine = rank ? `Estoy #${rank}${points !== undefined ? ` con ${points} pts` : ''} en TU MUNDIAL.` : 'Jugá conmigo en TU MUNDIAL.'
                        const text = `${result} en mi predicción 🏆\n${matchLine}\n${rankLine}\n¿Podés superarme? tu-mundial.vercel.app`
                        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
                      }}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 10, background: '#25D366', color: '#fff', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
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
    </div>
  )
}
