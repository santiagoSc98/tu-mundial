'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { format, addDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { Calendar, CalendarX } from 'lucide-react'
import MundialMatchCard from '@/components/MundialMatchCard'
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

const STAGE_ORDER: Record<string, number> = {
  GROUP_STAGE: 0,
  ROUND_OF_16: 1,
  QUARTER_FINALS: 2,
  SEMI_FINALS: 3,
  THIRD_PLACE: 4,
  FINAL: 5,
}

function parseStage(description: string | null): string {
  return description?.match(/Fase: ([A-Z_]+)/)?.[1] ?? 'OTHER'
}

function getKickoff(p: Prediction): Date {
  return new Date(new Date(p.deadline).getTime() + 10 * 60 * 1000)
}

type Tab = 'all' | 'today' | 'upcoming' | 'finished'

const TABS: { key: Tab; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'today', label: 'Hoy' },
  { key: 'upcoming', label: 'Próximos' },
  { key: 'finished', label: 'Finalizados' },
]

interface Props {
  predictions: Prediction[]
  existingAnswers: Record<string, string>
  voteDistributions: Record<string, Record<string, number>>
  userId: string | null
  totalVotes: number
}

export default function MundialView({
  predictions,
  existingAnswers,
  voteDistributions,
  userId,
  totalVotes,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('all')

  const now = new Date()
  const todayStr = format(now, 'yyyy-MM-dd')
  const tomorrowStr = format(addDays(now, 1), 'yyyy-MM-dd')
  const in7days = addDays(now, 7)

  const counts = useMemo<Record<Tab, number>>(() => ({
    all: predictions.length,
    today: predictions.filter(p => {
      const kf = getKickoff(p)
      return format(kf, 'yyyy-MM-dd') === todayStr && p.status !== 'resolved'
    }).length,
    upcoming: predictions.filter(p => {
      const kf = getKickoff(p)
      return format(kf, 'yyyy-MM-dd') > todayStr && kf <= in7days && p.status !== 'resolved'
    }).length,
    finished: predictions.filter(p => p.status === 'resolved').length,
  }), [predictions, todayStr]) // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    let result: Prediction[]
    if (activeTab === 'today') {
      result = predictions.filter(p => format(getKickoff(p), 'yyyy-MM-dd') === todayStr && p.status !== 'resolved')
    } else if (activeTab === 'upcoming') {
      result = predictions.filter(p => {
        const kf = getKickoff(p)
        return format(kf, 'yyyy-MM-dd') > todayStr && kf <= in7days && p.status !== 'resolved'
      })
    } else if (activeTab === 'finished') {
      result = predictions.filter(p => p.status === 'resolved')
    } else {
      result = predictions
    }
    return result.filter(p => p.id != null)
  }, [predictions, activeTab, todayStr]) // eslint-disable-line react-hooks/exhaustive-deps

  const groups = useMemo(() => {
    const byDate: Record<string, Record<string, Prediction[]>> = {}
    for (const p of filtered) {
      const kf = getKickoff(p)
      const dateKey = format(kf, 'yyyy-MM-dd')
      const stage = parseStage(p.description)
      if (!byDate[dateKey]) byDate[dateKey] = {}
      if (!byDate[dateKey][stage]) byDate[dateKey][stage] = []
      byDate[dateKey][stage].push(p)
    }

    return Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([dateKey, stages]) => {
        const kfDate = new Date(`${dateKey}T12:00:00`)
        let dateLabel: string
        let fullDate: string
        if (dateKey === todayStr) {
          dateLabel = 'HOY'
          fullDate = format(now, "d 'de' MMMM yyyy", { locale: es })
        } else if (dateKey === tomorrowStr) {
          dateLabel = 'MAÑANA'
          fullDate = format(kfDate, "d 'de' MMMM yyyy", { locale: es })
        } else {
          dateLabel = format(kfDate, "EEEE d 'de' MMM", { locale: es }).toUpperCase()
          fullDate = format(kfDate, "d 'de' MMMM yyyy", { locale: es })
        }

        return {
          dateKey,
          dateLabel,
          fullDate,
          stages: Object.entries(stages)
            .sort(([a], [b]) => (STAGE_ORDER[a] ?? 99) - (STAGE_ORDER[b] ?? 99))
            .map(([stageKey, preds]) => ({
              stageKey,
              stageLabel: STAGE_LABELS[stageKey] ?? '',
              predictions: preds,
            })),
        }
      })
  }, [filtered, todayStr, tomorrowStr]) // eslint-disable-line react-hooks/exhaustive-deps

  const openCount = predictions.filter(p => p.status !== 'resolved').length

  return (
    <div>
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="text-center mb-8"
      >
        <div className="flex items-center justify-center gap-4 mb-3">
          <div>
            <h1
              className="text-3xl font-black"
              style={{
                color: '#fff',
                letterSpacing: '-0.02em',
              }}
            >
              MUNDIAL 2026
            </h1>
            <p className="text-xs mt-0.5 tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>
              USA · CANADA · MEXICO
            </p>
          </div>
        </div>

        <div
          className="mx-auto mb-6"
          style={{
            width: 80,
            height: 1,
            background: 'rgba(0,82,165,0.45)',
          }}
        />

        {/* Stats */}
        <div className="flex items-center justify-center gap-6 sm:gap-10">
          {[
            { value: predictions.length, label: 'PARTIDOS' },
            { value: totalVotes.toLocaleString(), label: 'PREDICCIONES' },
            { value: openCount, label: 'ACTIVOS' },
          ].map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="stat-number text-2xl" style={{ color: 'var(--primary)' }}>
                {value}
              </p>
              <p className="text-xs mt-0.5 tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>
                {label}
              </p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Tab bar */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {TABS.map(({ key, label }, tabIndex) => {
          const count = counts[key]
          const isActive = activeTab === key
          return (
            <button
              key={`tab-${key}-${tabIndex}`}
              onClick={() => setActiveTab(key)}
              className="py-1.5 px-4 text-sm font-semibold"
              style={{
                background: isActive ? '#006A33' : 'transparent',
                color: isActive ? '#fff' : 'rgba(255,255,255,0.50)',
                border: isActive ? '1px solid #006A33' : '1px solid rgba(255,255,255,0.15)',
                borderRadius: '9999px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: isActive ? '0 2px 12px rgba(0,106,51,0.35)' : 'none',
              }}
            >
              {label}
              {count > 0 && (
                <span style={{ color: isActive ? 'rgba(255,255,255,0.70)' : 'rgba(255,255,255,0.30)', marginLeft: 4 }}>
                  ({count})
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Match list */}
      {groups.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20"
        >
          <CalendarX className="h-12 w-12 mx-auto mb-4" style={{ color: 'var(--mundial-muted)' }} />
          <p className="font-semibold mb-1" style={{ color: 'var(--mundial-empty-text)' }}>
            No hay partidos en esta sección
          </p>
          <button
            onClick={() => setActiveTab('all')}
            className="mt-4 text-sm font-medium"
            style={{ color: 'rgba(0,82,165,0.85)', textDecoration: 'underline', textUnderlineOffset: 2 }}
          >
            Ver todos los partidos →
          </button>
        </motion.div>
      ) : (
        <div className="space-y-8">
          {groups.map(({ dateKey, dateLabel, fullDate, stages }, groupIdx) => (
            <motion.div
              key={dateKey || `date-group-${groupIdx}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.32, delay: groupIdx * 0.055 }}
            >
              {/* Date header */}
              <div className="flex items-center gap-3 mb-4">
                <span className="flex items-center gap-1.5 text-sm font-black shrink-0" style={{ color: 'var(--secondary)', letterSpacing: '0.06em' }}>
                  <Calendar className="h-3.5 w-3.5" style={{ color: 'var(--secondary)' }} />
                  {dateLabel}
                </span>
                <span className="text-xs shrink-0" style={{ color: 'var(--mundial-date-full)' }}>
                  {fullDate}
                </span>
                <div
                  className="flex-1 h-px"
                  style={{ background: 'rgba(0,106,51,0.20)' }}
                />
              </div>

              {/* Stages */}
              <div className="space-y-5">
                {stages.map(({ stageKey, stageLabel, predictions: stagePreds }, stageIdx) => (
                  <div key={`${dateKey}-${stageKey}-${stageIdx}`}>
                    {stageLabel && (
                      <p
                        className="text-xs font-semibold mb-3 tracking-widest"
                        style={{ color: 'var(--mundial-stage)', textTransform: 'uppercase' }}
                      >
                        {stageLabel}
                      </p>
                    )}
                    <div className="space-y-3">
                      {stagePreds.map((prediction, idx) => (
                        <MundialMatchCard
                          key={prediction.id || `${dateKey}-${stageKey}-${idx}`}
                          prediction={prediction}
                          existingAnswer={existingAnswers[prediction.id] ?? null}
                          userId={userId}
                          voteDistribution={voteDistributions[prediction.id] ?? {}}
                          index={idx}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
