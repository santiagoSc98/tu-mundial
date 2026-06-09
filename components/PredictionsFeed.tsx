'use client'

import { useState } from 'react'
import Link from 'next/link'
import PredictionCard from './PredictionCard'
import type { Database } from '@/lib/database.types'

type Prediction = Database['public']['Tables']['predictions']['Row']

type Props = {
  predictions: Prediction[]
  existingAnswers: Record<string, string>
  voteDistributions: Record<string, Record<string, number>>
  userId: string | null
}

type Filter = 'all' | 'mundial' | 'otras'

const FILTER_LABELS: Record<Filter, string> = {
  all: 'Todas',
  mundial: '⚽ Mundial 2026',
  otras: 'Otras',
}

export default function PredictionsFeed({ predictions, existingAnswers, voteDistributions, userId }: Props) {
  const hasMundial = predictions.some(p => !!p.fixture_id)
  const [filter, setFilter] = useState<Filter>('all')

  const filtered = predictions.filter(p => {
    if (filter === 'mundial') return !!p.fixture_id
    if (filter === 'otras') return !p.fixture_id
    return true
  })

  return (
    <div>
      {hasMundial && (
        <div className="mb-5 space-y-2.5">
          {/* Mundial banner */}
          <Link
            href="/mundial"
            className="flex items-center justify-between px-4 py-3 rounded-xl group"
            style={{
              background: 'rgba(0,106,51,0.08)',
              border: '1px solid rgba(0,106,51,0.22)',
            }}
          >
            <div className="flex items-center gap-2.5">
              <span className="flex items-center justify-center h-8 w-8 rounded-lg shrink-0" style={{ background: '#006A33' }}><svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg></span>
              <div>
                <p className="text-sm font-bold" style={{ color: 'var(--secondary)' }}>Mundial 2026</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  Experiencia completa con todos los partidos
                </p>
              </div>
            </div>
            <span
              className="text-xs font-semibold group-hover:translate-x-0.5 transition-transform"
              style={{ color: 'rgba(0,106,51,0.80)' }}
            >
              Ver →
            </span>
          </Link>

          {/* Filter tabs */}
          <div className="flex gap-2 flex-wrap">
            {(['all', 'mundial', 'otras'] as Filter[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="px-3.5 py-1.5 rounded-full text-xs font-medium"
                style={{
                  background: filter === f ? '#006A33' : 'var(--bg-option)',
                  color: filter === f ? '#fff' : 'var(--text-secondary)',
                  border: `1px solid ${filter === f ? 'transparent' : 'var(--border-color)'}`,
                  transition: 'all 0.15s ease',
                }}
              >
                {FILTER_LABELS[f]}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {filtered.length > 0 ? (
          filtered.map((prediction, i) => (
            <PredictionCard
              key={prediction.id || `pred-${i}`}
              prediction={prediction}
              existingAnswer={existingAnswers[prediction.id] ?? null}
              userId={userId}
              index={i}
              voteDistribution={voteDistributions[prediction.id] ?? {}}
            />
          ))
        ) : (
          <div
            className="text-center py-16 rounded-2xl"
            style={{
              background: 'var(--bg-empty)',
              border: '1px dashed var(--border-empty)',
            }}
          >
            <p className="text-4xl mb-3">{filter === 'mundial' ? '⚽' : '🎯'}</p>
            <p className="text-sm" style={{ color: 'var(--text-empty)' }}>
              {filter === 'mundial'
                ? 'No hay partidos del Mundial disponibles'
                : filter === 'otras'
                ? 'No hay otras predicciones disponibles'
                : 'No hay predicciones disponibles por ahora'}
            </p>
            {filter === 'all' && (
              <p className="text-xs mt-1" style={{ color: 'var(--text-empty-sub)' }}>
                Volvé más tarde
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
