'use client'

import { useState, useEffect } from 'react'

export function CountdownTimer({ deadline }: { deadline: string }) {
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    const update = () => {
      const diff = new Date(deadline).getTime() - Date.now()
      if (diff <= 0) {
        setTimeLeft('Empezó')
        return
      }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setTimeLeft(h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`)
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [deadline])

  return (
    <div className="flex items-center justify-center gap-2">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
        stroke="#F6B73C" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 6v6l4 2"/>
      </svg>
      <span className="text-[#F6B73C] font-bold text-lg font-mono">{timeLeft}</span>
      <span className="text-xs text-gray-400">para el inicio</span>
    </div>
  )
}
