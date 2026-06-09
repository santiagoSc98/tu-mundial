import React from 'react'

const VARIANTS = {
  green: { bg: 'rgba(0,106,51,0.20)',    color: '#22c55e'  },
  gold:  { bg: 'rgba(246,183,60,0.15)', color: '#F6B73C'  },
  blue:  { bg: 'rgba(0,82,165,0.18)',   color: '#60a5fa'  },
  gray:  { bg: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.55)' },
} as const

interface AppBadgeProps {
  children: React.ReactNode
  variant?: keyof typeof VARIANTS
  style?: React.CSSProperties
}

export function AppBadge({ children, variant = 'green', style }: AppBadgeProps) {
  const { bg, color } = VARIANTS[variant]
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '3px 10px', borderRadius: 999,
      background: bg, color,
      fontSize: 11, fontWeight: 800,
      letterSpacing: '0.03em',
      ...style,
    }}>
      {children}
    </span>
  )
}
