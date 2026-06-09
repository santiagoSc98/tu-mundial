'use client'

import { useMemo, useState } from 'react'
import { CheckCircle, XCircle, Clock } from 'lucide-react'
import { getFlagUrl } from '@/lib/flagCodes'
import { pyTime, getTeamNameES } from '@/lib/worldcup'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Database } from '@/lib/database.types'

type Prediction = Database['public']['Tables']['predictions']['Row']
type Filter = 'todas' | 'acertadas' | 'falladas' | 'pendientes'

const STAGE_LABELS: Record<string, string> = {
  GROUP_STAGE:    'Grupos',
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

interface Props {
  predictions: Prediction[]
  existingAnswers: Record<string, string>
  existingScores: Record<string, { home: number; away: number }>
}

export default function MisPrediccionesTab({ predictions, existingAnswers, existingScores }: Props) {
  const [filter, setFilter] = useState<Filter>('todas')

  const myPredictions = useMemo(
    () => predictions.filter(p => existingAnswers[p.id] !== undefined),
    [predictions, existingAnswers]
  )

  const stats = useMemo(() => {
    const resolved = myPredictions.filter(p => p.status === 'resolved')
    return {
      total:   myPredictions.length,
      correct: resolved.filter(p => existingAnswers[p.id] === p.correct_answer).length,
      pending: myPredictions.filter(p => p.status !== 'resolved').length,
    }
  }, [myPredictions, existingAnswers])

  const filtered = useMemo(() => {
    switch (filter) {
      case 'acertadas':  return myPredictions.filter(p => p.status === 'resolved' && existingAnswers[p.id] === p.correct_answer)
      case 'falladas':   return myPredictions.filter(p => p.status === 'resolved' && existingAnswers[p.id] !== p.correct_answer)
      case 'pendientes': return myPredictions.filter(p => p.status !== 'resolved')
      default:           return myPredictions
    }
  }, [myPredictions, existingAnswers, filter])

  const sorted = useMemo(
    () => [...filtered].sort((a, b) => {
      const aOpen = a.status !== 'resolved' ? 0 : 1
      const bOpen = b.status !== 'resolved' ? 0 : 1
      if (aOpen !== bOpen) return aOpen - bOpen
      return new Date(a.deadline ?? 0).getTime() - new Date(b.deadline ?? 0).getTime()
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
            const isCorrect  = isResolved && answered === p.correct_answer
            const isFailed   = isResolved && !isCorrect

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
                      <span style={{ fontSize: 11, fontWeight: 800, color: '#22c55e' }}>+3 pts</span>
                    )}
                  </div>
                </div>

                {/* Pronóstico */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', background: 'rgba(0,0,0,0.12)', borderRadius: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.40)', flexShrink: 0 }}>Tu pronóstico:</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: STATUS.color }}>{pronóstico}</span>
                </div>

                {/* Resultado */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 4 }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', flexShrink: 0 }}>Resultado:</span>
                  {isResolved ? (
                    <span style={{ fontSize: 12, fontWeight: 600, color: isCorrect ? '#22c55e' : '#f87171' }}>
                      {p.correct_answer ?? '—'}
                    </span>
                  ) : (
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>Pendiente</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
