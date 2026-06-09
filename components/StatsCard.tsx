'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Flame, Trophy, TrendingUp } from 'lucide-react'

function useCountUp(target: number, duration = 1400) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (target === 0) return
    const startTime = Date.now()
    const tick = () => {
      const progress = Math.min((Date.now() - startTime) / duration, 1)
      setValue(Math.round((1 - Math.pow(1 - progress, 3)) * target))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [target, duration])
  return value
}

function CircularRing({ value, max }: { value: number; max: number }) {
  const r = 28
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - Math.min(value / max, 1))
  return (
    <svg viewBox="0 0 64 64" className="w-16 h-16" style={{ transform: 'rotate(-90deg)' }}>
      <defs>
        <linearGradient id="streakGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="var(--accent-red, #CE1126)" />
          <stop offset="100%" stopColor="#ef4444" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r={r} fill="none" stroke="var(--streak-track)" strokeWidth="5" />
      <motion.circle
        cx="32" cy="32" r={r}
        fill="none"
        stroke="url(#streakGrad)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.4, ease: 'easeOut', delay: 0.3 }}
      />
    </svg>
  )
}

export default function StatsCard({ points, streak }: { points: number; streak: number }) {
  const animPoints = useCountUp(points)
  const animStreak = useCountUp(streak, 1000)

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="relative mb-8 rounded-3xl overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      {/* Ambient glow */}
      <div className="absolute -top-16 -left-16 w-56 h-56 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0,82,165,0.12) 0%, transparent 70%)' }} />
      <div className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0,82,165,0.10) 0%, transparent 70%)' }} />

      <div className="relative p-6">
        <p className="text-xs font-bold uppercase tracking-widest mb-6"
          style={{ color: 'rgba(255,255,255,0.30)', letterSpacing: '0.12em' }}>
          Tu Progreso
        </p>

        <div className="grid grid-cols-3 gap-4 items-center">
          {/* Streak */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative flex items-center justify-center">
              <CircularRing value={streak} max={30} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="stat-number text-lg" style={{ color: '#fff' }}>
                  {animStreak}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Flame className="h-3.5 w-3.5" style={{ color: 'var(--secondary)' }} />
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.40)' }}>días racha</p>
            </div>
          </div>

          {/* Points */}
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl"
              style={{
                background: 'rgba(0,106,51,0.12)',
                border: '1px solid rgba(0,106,51,0.25)',
              }}>
              <Trophy className="h-6 w-6" style={{ color: 'var(--secondary)' }} />
            </div>
            <div className="text-center">
              <p className="stat-number text-3xl" style={{ color: 'var(--secondary)' }}>
                {animPoints.toLocaleString()}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>puntos</p>
            </div>
          </div>

          {/* Rank */}
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl"
              style={{
                background: 'rgba(0,82,165,0.15)',
                border: '1px solid rgba(0,82,165,0.30)',
              }}>
              <TrendingUp className="h-6 w-6" style={{ color: '#60a5fa' }} />
            </div>
            <div className="text-center">
              <p className="stat-number text-3xl" style={{ color: '#60a5fa' }}>—</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>ranking</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
