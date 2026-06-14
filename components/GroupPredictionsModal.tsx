'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { getGroupPredictionsForMatch } from '@/app/actions/groups'
import type { Group } from '@/components/MisGruposView'

type MatchPrediction = {
  user: { id: string; username: string | null; avatar_url: string | null }
  homeScore: number | null
  awayScore: number | null
  isCorrect: boolean | null
  pointsEarned: number | null
  hasPredicted: boolean
}

interface Props {
  groups: Group[]
  prediction: { id: string; exact_score_home: number | null; exact_score_away: number | null }
  onClose: () => void
}

export function GroupPredictionsModal({ groups, prediction, onClose }: Props) {
  const [activeIdx, setActiveIdx] = useState(0)
  const [data, setData]           = useState<MatchPrediction[]>([])
  const [loading, setLoading]     = useState(true)

  const group = groups[activeIdx]

  useEffect(() => {
    setLoading(true)
    setData([])
    getGroupPredictionsForMatch({ groupId: group.id, predictionId: prediction.id })
      .then(res => {
        if (res.data) setData(res.data as MatchPrediction[])
        setLoading(false)
      })
  }, [group.id, prediction.id])

  // Lock body scroll while modal is open
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  const content = (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999] p-4"
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-[#0f1a2e] border border-white/10 rounded-2xl p-5 w-full max-w-sm max-h-[80vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-base font-bold text-white">{group.name}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <p className="text-xs text-gray-400 mb-3">
          Resultado:{' '}
          <span className="font-bold text-white">
            {prediction.exact_score_home ?? '?'}–{prediction.exact_score_away ?? '?'}
          </span>
        </p>

        {/* Group tabs (only when multiple groups) */}
        {groups.length > 1 && (
          <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1">
            {groups.map((g, i) => (
              <button
                key={g.id}
                onClick={() => setActiveIdx(i)}
                className={`text-xs px-3 py-1.5 rounded-lg flex-shrink-0 transition-colors ${
                  i === activeIdx
                    ? 'bg-[#006A33] text-white font-semibold'
                    : 'bg-white/[0.06] text-gray-400 hover:bg-white/10'
                }`}
              >
                {g.name}
              </button>
            ))}
          </div>
        )}

        {/* Member list */}
        {loading ? (
          <p className="text-center text-gray-500 py-8 text-sm">Cargando...</p>
        ) : data.length === 0 ? (
          <p className="text-center text-gray-500 py-8 text-sm">Sin predicciones en este grupo</p>
        ) : (
          <div className="space-y-2">
            {data.map(item => (
              <div
                key={item.user.id}
                className={`flex items-center justify-between p-3 rounded-xl border ${
                  item.isCorrect === true
                    ? 'bg-[rgba(0,196,106,0.06)] border-[rgba(0,196,106,0.2)]'
                    : item.isCorrect === false
                    ? 'bg-[rgba(206,17,38,0.05)] border-[rgba(206,17,38,0.15)]'
                    : 'bg-white/[0.04] border-white/[0.08]'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {item.user.avatar_url ? (
                    <img src={item.user.avatar_url} alt="" className="w-8 h-8 rounded-full flex-shrink-0 object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full flex-shrink-0 bg-white/10 flex items-center justify-center text-xs text-gray-400">
                      {(item.user.username ?? '?')[0].toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm font-medium text-white truncate">
                    {item.user.username?.split(' ')[0] ?? 'Usuario'}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {item.hasPredicted ? (
                    <>
                      <span className={`text-sm font-bold ${item.isCorrect ? 'text-[#00C46A]' : item.isCorrect === false ? 'text-[#CE1126]' : 'text-gray-300'}`}>
                        {item.homeScore}–{item.awayScore}
                      </span>
                      {item.pointsEarned != null && item.pointsEarned > 0 && (
                        <span className={`text-[10px] font-bold rounded-md px-1.5 py-0.5 ${
                          item.pointsEarned >= 8
                            ? 'bg-[rgba(0,196,106,0.15)] text-[#00C46A]'
                            : 'bg-[rgba(77,159,255,0.15)] text-[#4d9fff]'
                        }`}>
                          +{item.pointsEarned}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-xs text-gray-500">Sin pronóstico</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  return createPortal(content, document.body)
}
