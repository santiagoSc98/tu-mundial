'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { getAllPredictionsForMatch } from '@/app/actions/predictions'

type MatchPrediction = {
  user: { id: string; username: string | null; avatar_url: string | null }
  isMe: boolean
  homeScore: number | null
  awayScore: number | null
  isCorrect: boolean | null
  pointsEarned: number | null
  hasPredicted: boolean
}

type Stats = {
  total: number
  totalCorrect: number
  totalWithPrediction: number
  accuracy: number
}

interface Props {
  prediction: { id: string; exact_score_home: number | null; exact_score_away: number | null }
  userGroups: { id: string; name: string }[]
  matchTitle: string
  onClose: () => void
}

export function PredictionsModal({ prediction, userGroups, matchTitle, onClose }: Props) {
  const [tab, setTab]                   = useState<'all' | 'groups'>('all')
  const [selectedGroup, setSelectedGroup] = useState(userGroups[0]?.id ?? '')
  const [data, setData]                 = useState<MatchPrediction[]>([])
  const [stats, setStats]               = useState<Stats | null>(null)
  const [loading, setLoading]           = useState(true)

  useEffect(() => {
    setLoading(true)
    getAllPredictionsForMatch({
      predictionId: prediction.id,
      groupId: tab === 'groups' ? selectedGroup : undefined,
    }).then(result => {
      if (result.data) {
        setData(result.data as MatchPrediction[])
        setStats(result.stats as Stats)
      }
      setLoading(false)
    })
  }, [prediction.id, tab, selectedGroup])

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
      <div className="bg-[#0f1a2e] border border-white/10 rounded-2xl p-5 w-full max-w-sm max-h-[85vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-base font-bold text-white">Predicciones</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <p className="text-xs text-gray-400 mb-3">
          {matchTitle} · Resultado:{' '}
          <span className="font-bold text-white">
            {prediction.exact_score_home ?? '?'}–{prediction.exact_score_away ?? '?'}
          </span>
        </p>

        {/* Tabs — only when user belongs to at least one group */}
        {userGroups.length > 0 && (
          <div className="flex gap-1 mb-3 bg-white/[0.05] p-1 rounded-xl">
            <button
              onClick={() => setTab('all')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                tab === 'all' ? 'bg-[#006A33] text-white' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setTab('groups')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                tab === 'groups' ? 'bg-[#006A33] text-white' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Mi grupo
            </button>
          </div>
        )}

        {/* Group selector when user has multiple groups */}
        {tab === 'groups' && userGroups.length > 1 && (
          <select
            value={selectedGroup}
            onChange={e => setSelectedGroup(e.target.value)}
            className="w-full bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2 text-sm text-white mb-3 appearance-none"
          >
            {userGroups.map(g => (
              <option key={g.id} value={g.id} className="bg-[#0f1a2e]">{g.name}</option>
            ))}
          </select>
        )}

        {loading ? (
          <p className="text-center text-gray-500 py-8 text-sm">Cargando...</p>
        ) : (
          <>
            {/* Stats bar */}
            {stats && stats.totalWithPrediction > 0 && (
              <div className="flex justify-between bg-white/[0.04] rounded-xl px-3 py-2.5 mb-3 text-xs text-gray-300">
                <span>{stats.totalCorrect} de {stats.totalWithPrediction} acertaron</span>
                <span className="font-bold text-[#00C46A]">{stats.accuracy}% efectividad</span>
              </div>
            )}

            {data.length === 0 ? (
              <p className="text-center text-gray-500 py-8 text-sm">Sin predicciones</p>
            ) : (
              <div className="space-y-2">
                {data.map(item => (
                  <div
                    key={item.user.id}
                    className={`flex items-center justify-between p-2.5 rounded-xl border ${
                      item.isMe
                        ? item.isCorrect
                          ? 'border-[#00C46A] bg-[rgba(0,196,106,0.06)]'
                          : item.isCorrect === false
                          ? 'border-[#CE1126] bg-[rgba(206,17,38,0.05)]'
                          : 'border-[#4d9fff] bg-[rgba(77,159,255,0.05)]'
                        : item.isCorrect === true
                        ? 'bg-[rgba(0,196,106,0.06)] border-[rgba(0,196,106,0.2)]'
                        : item.isCorrect === false
                        ? 'bg-[rgba(206,17,38,0.05)] border-[rgba(206,17,38,0.15)]'
                        : 'bg-white/[0.04] border-white/[0.08]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {item.user.avatar_url ? (
                        <img
                          src={item.user.avatar_url}
                          alt=""
                          className="w-7 h-7 rounded-full flex-shrink-0 object-cover"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full flex-shrink-0 bg-white/10 flex items-center justify-center text-[10px] text-gray-400">
                          {(item.user.username ?? '?')[0].toUpperCase()}
                        </div>
                      )}
                      <span className="text-xs font-medium text-white truncate">
                        {item.user.username?.split(' ')[0] ?? 'Usuario'}
                        {item.isMe && <span className="text-[10px] text-gray-500 ml-1">(tú)</span>}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {item.hasPredicted ? (
                        <>
                          <span className={`text-sm font-bold ${
                            item.isCorrect ? 'text-[#00C46A]' : item.isCorrect === false ? 'text-[#CE1126]' : 'text-gray-300'
                          }`}>
                            {item.homeScore}–{item.awayScore}
                          </span>
                          <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0 ${
                            item.isCorrect ? 'bg-[rgba(0,196,106,0.15)]' : item.isCorrect === false ? 'bg-[rgba(206,17,38,0.15)]' : 'bg-white/10'
                          }`}>
                            {item.isCorrect === true ? (
                              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#00C46A" strokeWidth="3">
                                <polyline points="20 6 9 17 4 12"/>
                              </svg>
                            ) : item.isCorrect === false ? (
                              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#CE1126" strokeWidth="3">
                                <path d="M18 6L6 18M6 6l12 12"/>
                              </svg>
                            ) : null}
                          </div>
                          {item.isCorrect && item.pointsEarned != null && item.pointsEarned > 0 && (
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
                        <span className="text-[10px] text-gray-500 italic">Sin pronóstico</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )

  return createPortal(content, document.body)
}
