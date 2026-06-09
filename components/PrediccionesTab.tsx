'use client'

import { useMemo, useState } from 'react'
import { Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import MundialMatchCard from '@/components/MundialMatchCard'
import type { Database } from '@/lib/database.types'

type Prediction = Database['public']['Tables']['predictions']['Row']
type Filter = 'todos' | 'hoy' | 'proximos' | 'finalizados'

const STAGE_LABELS: Record<string, string> = {
  GROUP_STAGE:    'Fase de Grupos',
  ROUND_OF_16:    'Octavos de Final',
  QUARTER_FINALS: 'Cuartos de Final',
  SEMI_FINALS:    'Semifinales',
  THIRD_PLACE:    'Tercer Puesto',
  FINAL:          'Final',
}

function getStageLabel(description: string | null): string {
  if (!description) return 'Otros'
  const key = description.match(/Fase: ([A-Z_]+)/)?.[1] ?? ''
  return STAGE_LABELS[key] ?? (key || 'Otros')
}

interface Props {
  userId: string
  predictions: Prediction[]
  existingAnswers: Record<string, string>
  voteDistributions: Record<string, Record<string, number>>
}

export default function PrediccionesTab({ userId, predictions, existingAnswers, voteDistributions }: Props) {
  const [filter, setFilter] = useState<Filter>('todos')

  // ── Filter & group ───────────────────────────────────────────────────────────
  const filteredPredictions = useMemo(() => {
    const now   = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    switch (filter) {
      case 'hoy':
        return predictions.filter(p => {
          const d   = new Date(p.deadline)
          const day = new Date(d.getFullYear(), d.getMonth(), d.getDate())
          return day.getTime() === today.getTime()
        })
      case 'proximos':
        return predictions.filter(p => new Date(p.deadline) > now && p.status === 'open')
      case 'finalizados':
        return predictions.filter(p => p.status === 'resolved')
      default:
        return predictions
    }
  }, [predictions, filter])

  const groupedByDate = useMemo(() => {
    const groups: Record<string, Prediction[]> = {}
    filteredPredictions.forEach(p => {
      const dateKey = p.deadline.split('T')[0]
      if (!groups[dateKey]) groups[dateKey] = []
      groups[dateKey].push(p)
    })
    return Object.entries(groups).sort(
      (a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime()
    )
  }, [filteredPredictions])

  const now        = new Date()
  const totalCount = predictions.length
  const myCount    = Object.keys(existingAnswers).length
  const openCount  = predictions.filter(p => p.status === 'open' && new Date(p.deadline) > now).length

  // ── Filter tab labels ────────────────────────────────────────────────────────
  const FILTERS: [Filter, string][] = [
    ['todos',       `Todos (${totalCount})`],
    ['hoy',         'Hoy'],
    ['proximos',    'Próximos'],
    ['finalizados', 'Finalizados'],
  ]

  return (
    <div>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="mb-8">
        <h1
          className="text-3xl font-bold mb-6"
          style={{ color: '#fff', fontFamily: 'var(--font-montserrat, system-ui)' }}
        >
          Predicciones
        </h1>

        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { value: totalCount, label: 'PARTIDOS',    color: '#0052A5' },
            { value: myCount,    label: 'MIS PRED.',   color: '#006A33' },
            { value: openCount,  label: 'ABIERTOS',    color: '#F6B73C' },
          ].map(s => (
            <div
              key={s.label}
              className="rounded-2xl p-4 text-center"
              style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)' }}
            >
              <p
                className="text-3xl font-bold mb-1"
                style={{ color: s.color, fontFamily: 'var(--font-montserrat, system-ui)' }}
              >
                {s.value}
              </p>
              <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.40)', letterSpacing: '0.07em' }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Filter tabs ─────────────────────────────────────────────────── */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {FILTERS.map(([id, label]) => (
          <button
            key={id}
            onClick={() => setFilter(id)}
            className="px-5 py-2.5 rounded-full font-semibold whitespace-nowrap text-sm shrink-0"
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

      {/* ── Match list ──────────────────────────────────────────────────── */}
      {groupedByDate.length === 0 ? (
        <div className="text-center py-20">
          <Calendar className="h-10 w-10 mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.20)' }} />
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14 }}>
            No hay partidos en esta categoría
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {groupedByDate.map(([dateKey, matches]) => {
            const date     = new Date(dateKey + 'T12:00:00')
            const dayLabel = format(date, "EEEE d 'de' MMM", { locale: es }).toUpperCase()
            const fullDate = format(date, "d 'de' MMMM 'de' yyyy", { locale: es })

            const byStage: Record<string, Prediction[]> = {}
            matches.forEach(m => {
              const stage = getStageLabel(m.description)
              if (!byStage[stage]) byStage[stage] = []
              byStage[stage].push(m)
            })

            return (
              <div key={dateKey}>
                <div className="flex items-center gap-4 mb-5">
                  <div
                    className="px-4 py-1.5 rounded-xl font-bold text-xs shrink-0"
                    style={{ background: 'rgba(206,17,38,0.15)', color: '#CE1126', letterSpacing: '0.05em' }}
                  >
                    {dayLabel}
                  </div>
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>{fullDate}</p>
                </div>

                {Object.entries(byStage).map(([stage, stageMatches]) => (
                  <div key={stage} className="mb-6">
                    <div className="px-4 py-2 rounded-xl mb-4" style={{ background: 'rgba(255,255,255,0.04)' }}>
                      <p className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.40)', letterSpacing: '0.07em' }}>
                        {stage.toUpperCase()}
                      </p>
                    </div>

                    <div className="space-y-4">
                      {stageMatches.map((match, idx) => (
                        <MundialMatchCard
                          key={match.id}
                          prediction={match}
                          existingAnswer={existingAnswers[match.id] ?? null}
                          userId={userId}
                          voteDistribution={voteDistributions[match.id] ?? {}}
                          index={idx}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
