'use client'

import Link from 'next/link'

export default function GruposBanner() {
  return (
    <Link
      href="/mundial/grupos"
      className="flex items-center justify-between gap-3 rounded-2xl px-5 py-3.5 mb-6"
      style={{
        background: 'rgba(0,82,165,0.08)',
        border: '1px solid rgba(0,82,165,0.20)',
        backdropFilter: 'blur(12px)',
        textDecoration: 'none',
        transition: 'border-color 0.15s ease, background 0.15s ease',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,82,165,0.38)'
        ;(e.currentTarget as HTMLElement).style.background = 'rgba(0,82,165,0.14)'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,82,165,0.20)'
        ;(e.currentTarget as HTMLElement).style.background = 'rgba(0,82,165,0.08)'
      }}
    >
      <div className="flex items-center gap-3">
        <span className="flex items-center justify-center h-8 w-8 rounded-lg shrink-0" style={{ background: '#0052A5' }}><svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg></span>
        <div>
          <p className="text-sm font-bold" style={{ color: 'var(--secondary)', letterSpacing: '0.02em' }}>
            Tabla de Grupos
          </p>
          <p className="text-xs" style={{ color: 'var(--mundial-muted)' }}>
            Posiciones del Mundial 2026
          </p>
        </div>
      </div>
      <span className="text-sm font-semibold" style={{ color: 'rgba(0,82,165,0.70)' }}>→</span>
    </Link>
  )
}
