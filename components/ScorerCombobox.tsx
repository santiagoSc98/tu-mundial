'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { STRIKERS } from '@/lib/strikers'

const STRIKER_NAMES: string[] = STRIKERS.map(s => s.name)

interface Props {
  value: string
  onChange: (v: string) => void
  disabled?: boolean
  variant?: 'dark' | 'theme'
  placeholder?: string
}

export default function ScorerCombobox({
  value,
  onChange,
  disabled = false,
  variant = 'theme',
  placeholder = 'Nombre del jugador...',
}: Props) {
  const [open,    setOpen]    = useState(false)
  const [pos,     setPos]     = useState({ top: 0, left: 0, width: 0 })
  const [mounted, setMounted] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      if (inputRef.current?.contains(target) || panelRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const filtered = value.trim().length > 0
    ? STRIKER_NAMES.filter((s: string) => s.toLowerCase().includes(value.toLowerCase()))
    : STRIKER_NAMES

  const openPanel = () => {
    if (!inputRef.current) return
    const r = inputRef.current.getBoundingClientRect()
    setPos({ top: r.bottom + 6, left: r.left, width: r.width })
    setOpen(true)
  }

  const handleSelect = (name: string) => {
    onChange(name)
    setOpen(false)
  }

  const isDark = variant === 'dark'
  const inputBg     = isDark ? 'rgba(255,255,255,0.06)'  : 'var(--mundial-option-bg)'
  const inputBorder = (focused: boolean) =>
    focused
      ? 'rgba(0,82,165,0.45)'
      : isDark ? 'rgba(255,255,255,0.12)' : 'var(--mundial-option-border)'
  const inputColor  = isDark ? 'rgba(255,255,255,0.90)' : 'var(--mundial-team-name)'
  const panelBg     = isDark ? '#1e293b' : 'var(--bg-secondary)'
  const itemColor   = isDark ? 'rgba(255,255,255,0.85)' : 'var(--mundial-team-name)'
  const itemHover   = isDark ? 'rgba(255,255,255,0.06)' : 'var(--mundial-option-bg)'
  const mutedColor  = isDark ? 'rgba(255,255,255,0.30)' : 'var(--mundial-muted)'

  const panel = (
    <AnimatePresence>
      {open && filtered.length > 0 && (
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
              overflowY: 'auto',
              maxHeight: 280,
              scrollbarWidth: 'thin',
            }}
          >
            {filtered.map((name: string) => {
              const isSel = name === value
              return (
                <button
                  key={name}
                  type="button"
                  onMouseDown={e => { e.preventDefault(); handleSelect(name) }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 14px', textAlign: 'left', cursor: 'pointer',
                    background: isSel ? 'rgba(0,82,165,0.10)' : 'transparent',
                    color: isSel ? 'var(--primary)' : itemColor,
                    border: 'none', fontSize: '0.8125rem',
                    fontWeight: isSel ? 600 : 400,
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => { if (!isSel) (e.currentTarget as HTMLElement).style.background = itemHover }}
                  onMouseLeave={e => { if (!isSel) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                >
                  {name}
                </button>
              )
            })}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )

  return (
    <div style={{ position: 'relative' }}>
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: inputBg,
          border: `1px solid ${inputBorder(open)}`,
          borderRadius: '0.875rem',
          boxShadow: open ? '0 0 0 3px rgba(0,82,165,0.08)' : 'none',
          transition: 'border-color 0.15s, box-shadow 0.15s',
          padding: '14px 16px',
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={e => { onChange(e.target.value); if (!open) openPanel() }}
          onFocus={openPanel}
          onKeyDown={e => { if (e.key === 'Escape') setOpen(false) }}
          disabled={disabled}
          placeholder={placeholder}
          style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            fontSize: '0.875rem', fontWeight: 500,
            color: value ? inputColor : mutedColor,
            cursor: disabled ? 'not-allowed' : 'text',
            minWidth: 0,
          }}
        />
        {value && !disabled && (
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); onChange(''); inputRef.current?.focus() }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', flexShrink: 0 }}
          >
            <X style={{ width: 14, height: 14, color: mutedColor }} />
          </button>
        )}
      </div>
      {mounted && createPortal(panel, document.body)}
    </div>
  )
}
