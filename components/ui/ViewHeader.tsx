import React from 'react'

interface ViewHeaderProps {
  icon: React.ReactNode
  title: string
  subtitle: string
  /** Color del accent: fondo + borde del icono. Default verde #006A33 */
  accent?: string
}

export function ViewHeader({ icon, title, subtitle, accent = '#006A33' }: ViewHeaderProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
        background: `color-mix(in srgb, ${accent} 18%, transparent)`,
        border: `1px solid color-mix(in srgb, ${accent} 35%, transparent)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: accent,
      }}>
        {icon}
      </div>
      <div>
        <h1 style={{
          fontSize: 28, fontWeight: 700, color: '#fff', margin: 0,
          fontFamily: 'var(--font-montserrat, system-ui)',
          letterSpacing: '-0.01em', lineHeight: 1.2,
        }}>
          {title}
        </h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.40)', margin: 0, marginTop: 2 }}>
          {subtitle}
        </p>
      </div>
    </div>
  )
}
