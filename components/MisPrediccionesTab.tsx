'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Loader2, Trophy, Flame, Target, CheckCircle, Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

type HistoryItem = {
  id: string
  predicted_answer: string
  points_earned: number | null
  is_correct: boolean | null
  created_at: string
  predictions: {
    id: string
    title: string
    category: string
    correct_answer: string | null
    status: string
    deadline: string
  } | null
}


interface Props {
  userId: string | null
  points: number
  streak: number
}

export default function MisPrediccionesTab({ userId, points, streak }: Props) {
  const [history,  setHistory]  = useState<HistoryItem[]>([])
  const [loading,  setLoading]  = useState(true)
  const supabase = useRef(createClient()).current

  useEffect(() => {
    if (!userId) { setLoading(false); return }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(supabase as any)
      .from('user_predictions')
      .select('id, predicted_answer, points_earned, is_correct, created_at, predictions(id, title, category, correct_answer, status, deadline)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data }: { data: HistoryItem[] | null }) => {
        setHistory(data ?? [])
        setLoading(false)
      })
  }, [userId]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!userId) {
    return (
      <div className="text-center py-20">
        <Lock className="h-10 w-10 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Iniciá sesión para ver tus predicciones</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20" style={{ color: 'var(--mundial-muted)' }}>
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  const resolved = history.filter(h => h.is_correct !== null)
  const correct  = resolved.filter(h => h.is_correct === true).length
  const accuracy = resolved.length > 0 ? Math.round((correct / resolved.length) * 100) : 0

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {[
          { icon: <Trophy className="h-4 w-4" />,      label: 'puntos totales',  value: points.toLocaleString(), color: '#006A33', delay: 0.00 },
          { icon: <Target className="h-4 w-4" />,      label: 'predicciones',    value: history.length,          color: '#0052A5', delay: 0.05 },
          { icon: <CheckCircle className="h-4 w-4" />, label: 'acierto',         value: `${accuracy}%`,          color: '#006A33', delay: 0.10 },
          { icon: <Flame className="h-4 w-4" />,       label: 'días de racha',   value: streak,                  color: '#CE1126', delay: 0.15 },
        ].map(s => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: s.delay }}
            className="card rounded-2xl p-5 flex flex-col gap-2"
          >
            <div className="flex items-center justify-center h-10 w-10 rounded-xl" style={{ background: `${s.color}15`, color: s.color }}>
              {s.icon}
            </div>
            <p className="stat-number text-2xl" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.40)' }}>{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="card rounded-2xl overflow-hidden"
      >
        <div className="px-6 py-4 flex items-center justify-between"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <h2 className="font-bold text-sm" style={{ color: '#fff' }}>Historial</h2>
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{history.length} en total</span>
        </div>

        {history.length === 0 ? (
          <div className="text-center py-16">
            <Target className="h-10 w-10 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Todavía no hiciste ninguna predicción</p>
          </div>
        ) : (
          history.map((item, i) => {
            const pred = item.predictions
            if (!pred) return null
            const isPending = item.is_correct === null
            return (
              <div key={item.id} className="px-6 py-4" style={{ borderTop: i > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-snug mb-2" style={{ color: 'var(--text-primary)' }}>{pred.title}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                      <span style={{ color: 'var(--text-secondary)' }}>
                        Tu respuesta: <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{item.predicted_answer}</span>
                      </span>
                      {pred.status === 'resolved' && pred.correct_answer && (
                        <span style={{ color: 'var(--text-secondary)' }}>
                          Correcta: <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{pred.correct_answer}</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    {isPending ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: 'rgba(148,163,184,0.10)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
                        ⏳ Pendiente
                      </span>
                    ) : item.is_correct ? (
                      <div className="flex flex-col items-end gap-1">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.25)' }}>
                          ✅ Acertaste
                        </span>
                        {item.points_earned != null && item.points_earned > 0 && (
                          <span className="text-xs font-bold" style={{ color: 'var(--secondary)' }}>+{item.points_earned} pts</span>
                        )}
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: 'rgba(239,68,68,0.10)', color: '#f87171', border: '1px solid rgba(239,68,68,0.22)' }}>
                        ❌ Fallaste
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                  {format(new Date(item.created_at), "d MMM yyyy 'a las' HH:mm", { locale: es })}
                </p>
              </div>
            )
          })
        )}
      </motion.div>
    </>
  )
}
