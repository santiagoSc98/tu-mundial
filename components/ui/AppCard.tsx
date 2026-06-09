import React from 'react'

interface AppCardProps {
  children: React.ReactNode
  style?: React.CSSProperties
  className?: string
  padding?: number | string
}

export function AppCard({ children, style, className, padding = 20 }: AppCardProps) {
  return (
    <div
      className={className}
      style={{
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 24,
        padding,
        ...style,
      }}
    >
      {children}
    </div>
  )
}
