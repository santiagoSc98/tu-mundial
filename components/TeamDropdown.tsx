'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ChevronDown, Search, X } from 'lucide-react'
import { getFlagUrl } from '@/lib/flagCodes'
import { MUNDIAL_TEAMS } from '@/lib/mundialTeams'

interface Props {
  value: string | null
  onChange: (tla: string, name: string) => void
  disabled?: boolean
  /** 'dark' = onboarding / always dark  |  'theme' = respeta CSS vars (default) */
  variant?: 'dark' | 'theme'
}

export default function TeamDropdown({ value, onChange, disabled = false, variant = 'theme' }: Props) {
  const [open,    setOpen]    = useState(false)
  const [query,   setQuery]   = useState('')
  const [pos,     setPos]     = useState({ top: 0, left: 0, width: 0 })
  const [mounted, setMounted] = useState(false)

  const btnRef    = useRef<HTMLButtonElement>(null)
  const panelRef  = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLInputElement>(null)

  useEffect(() => { setMounted(true) }, [])

  // Close on outside mousedown — scroll inside panel does NOT close
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      if (btnRef.current?.contains(target) || panelRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Focus search input when panel opens
  useEffect(() => {
    if (open) {
      setQuery('')
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const handleToggle = useCallback(() => {
    if (disabled) return
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setPos({ top: r.bottom + 6, left: r.left, width: Math.max(r.width, 280) })
    }
    setOpen(o => !o)
  }, [open, disabled])

  const handleSelect = (tla: string, name: string) => {
    onChange(tla, name)
    setOpen(false)
  }

  const filtered = MUNDIAL_TEAMS.filter(t =>
    query === '' ||
    t.name.toLowerCase().includes(query.toLowerCase()) ||
    t.tla.toLowerCase().includes(query.toLowerCase())
  )

  const selected  = value ? MUNDIAL_TEAMS.find(t => t.tla === value) : null
  const flagUrl   = selected ? getFlagUrl(selected.tla) : null

  // Colours depend on variant
  const isDark = variant === 'dark'
  const btnBg     = isDark ? 'rgba(255,255,255,0.06)'  : 'var(--mundial-option-bg)'
  const btnBorder = (active: boolean) =>
    active
      ? 'rgba(0,82,165,0.45)'
      : isDark ? 'rgba(255,255,255,0.12)' : 'var(--mundial-option-border)'
  const btnColor  = selected
    ? isDark ? 'rgba(255,255,255,0.90)' : 'var(--mundial-team-name)'
    : isDark ? 'rgba(255,255,255,0.35)' : 'var(--mundial-muted)'
  const panelBg   = isDark ? '#1e293b' : 'var(--bg-secondary)'
  const itemColor = (sel: boolean) =>
    sel ? 'var(--secondary)' : isDark ? 'rgba(255,255,255,0.85)' : 'var(--mundial-team-name)'
  const itemHover = isDark ? 'rgba(255,255,255,0.06)' : 'var(--mundial-option-bg)'
  const inputBg   = isDark ? 'rgba(255,255,255,0.05)' : 'var(--mundial-option-bg)'
  const inputBorder = isDark ? 'rgba(255,255,255,0.10)' : 'var(--mundial-option-border)'
  const inputColor  = isDark ? 'rgba(255,255,255,0.80)' : 'var(--mundial-team-name)'
  const mutedColor  = isDark ? 'rgba(255,255,255,0.30)' : 'var(--mundial-muted)'

  const panel = (
    <AnimatePresence>
      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'none' }}>
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: -6, scaleY: 0.96 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -4, scaleY: 0.96 }}
            transition={{ duration: 0.14, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              top: pos.top, left: pos.left, width: pos.width,
              transformOrigin: 'top',
              background: panelBg,
              border: '1px solid rgba(0,82,165,0.20)',
              borderRadius: '0.875rem',
              boxShadow: '0 20px 48px rgba(0,0,0,0.40)',
              pointerEvents: 'auto',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: 380,
            }}
          >
            {/* Search input */}
            <div style={{ padding: '10px 12px', borderBottom: `1px solid ${inputBorder}`, flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: inputBg, border: `1px solid ${inputBorder}`, borderRadius: '0.625rem', padding: '7px 12px' }}>
                <Search style={{ width: 14, height: 14, color: mutedColor, flexShrink: 0 }} />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Buscar equipo..."
                  style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: '0.8125rem', color: inputColor, minWidth: 0 }}
                />
                {query && (
                  <button
                    type="button"
                    onMouseDown={e => { e.preventDefault(); setQuery('') }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
                  >
                    <X style={{ width: 13, height: 13, color: mutedColor }} />
                  </button>
                )}
              </div>
            </div>

            {/* Results list */}
            <div style={{ overflowY: 'auto', flex: 1, scrollbarWidth: 'thin' }}>
              {filtered.length === 0 ? (
                <p style={{ padding: '20px 16px', textAlign: 'center', fontSize: '0.8125rem', color: mutedColor }}>
                  Sin resultados para "{query}"
                </p>
              ) : (
                filtered.map(team => {
                  const flag  = getFlagUrl(team.tla)
                  const isSel = team.tla === value
                  return (
                    <button
                      key={team.tla}
                      type="button"
                      onMouseDown={e => { e.preventDefault(); handleSelect(team.tla, team.name) }}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                        padding: '9px 14px', textAlign: 'left', cursor: 'pointer',
                        background: isSel ? 'rgba(0,106,51,0.10)' : 'transparent',
                        color: itemColor(isSel),
                        border: 'none', transition: 'background 0.1s',
                        fontSize: '0.8125rem', fontWeight: isSel ? 600 : 400,
                      }}
                      onMouseEnter={e => { if (!isSel) (e.currentTarget as HTMLElement).style.background = itemHover }}
                      onMouseLeave={e => { if (!isSel) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                    >
                      {flag
                        ? <img src={flag} alt={team.tla} style={{ width: 28, height: 20, objectFit: 'cover', borderRadius: 3, flexShrink: 0 }} />
                        : <div style={{ width: 28, height: 20, background: 'rgba(255,255,255,0.08)', borderRadius: 3, flexShrink: 0 }} />
                      }
                      <span style={{ flex: 1 }}>{team.name}</span>
                      {isSel && <Check style={{ width: 14, height: 14, color: 'var(--secondary)', flexShrink: 0 }} />}
                    </button>
                  )
                })
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )

  return (
    <div>
      <button
        ref={btnRef}
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 16px', borderRadius: '0.875rem', textAlign: 'left',
          background: btnBg,
          border: `1px solid ${btnBorder(open)}`,
          color: btnColor,
          cursor: disabled ? 'not-allowed' : 'pointer',
          boxShadow: open ? '0 0 0 3px rgba(0,82,165,0.08)' : 'none',
          transition: 'border-color 0.15s, box-shadow 0.15s',
        }}
      >
        {flagUrl
          ? <img src={flagUrl} alt={selected!.tla} style={{ width: 32, height: 22, objectFit: 'cover', borderRadius: 3, flexShrink: 0 }} />
          : <div style={{ width: 32, height: 22, background: 'rgba(255,255,255,0.08)', borderRadius: 3, flexShrink: 0 }} />
        }
        <span style={{ flex: 1, fontSize: '0.875rem', fontWeight: 500 }}>
          {selected ? selected.name : 'Seleccioná un equipo'}
        </span>
        <ChevronDown style={{
          width: 16, height: 16, flexShrink: 0,
          color: isDark ? 'rgba(255,255,255,0.35)' : 'var(--mundial-muted)',
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.18s',
        }} />
      </button>

      {mounted && createPortal(panel, document.body)}
    </div>
  )
}
