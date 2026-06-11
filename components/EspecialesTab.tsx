'use client'

import { useState, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { saveSpecialPredictions } from '@/app/actions/predictions'
import { Check, AlertCircle, Loader2, Edit2, Trophy, Target, X, ArrowLeft } from 'lucide-react'
import { getFlagUrl } from '@/lib/flagCodes'
import { MUNDIAL_TEAMS } from '@/lib/mundialTeams'
import { STRIKERS } from '@/lib/strikers'
import TeamDropdown from '@/components/TeamDropdown'
import ScorerCombobox from '@/components/ScorerCombobox'

interface Props {
  userId: string
  championTeam: string | null
  topScorer: string | null
  onTabChange?: (tab: string) => void
}

function getTla(teamName: string | null): string | null {
  if (!teamName) return null
  return MUNDIAL_TEAMS.find(t => t.name === teamName)?.tla ?? null
}

function EmptyCard({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '32px 20px', background: `${color}06`, borderRadius: 16, border: `1px dashed ${color}30` }}>
      <div style={{ width: 80, height: 54, borderRadius: 10, background: `${color}10`, border: `1px dashed ${color}25` }} />
      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', fontStyle: 'italic', margin: 0, textAlign: 'center' }}>{label}</p>
    </div>
  )
}

export default function EspecialesTab({ userId, championTeam, topScorer, onTabChange }: Props) {
  const [editing,      setEditing]      = useState(false)
  const [championTla,  setChampionTla]  = useState<string | null>(getTla(championTeam))
  const [championName, setChampionName] = useState<string | null>(championTeam)
  const [scorer,       setScorer]       = useState(topScorer ?? '')
  const [saving,       setSaving]       = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string; visible: boolean }>({
    type: 'success', message: '', visible: false,
  })
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const DEADLINE = new Date('2026-06-26T23:59:00-03:00')
  const isClosed = new Date() > DEADLINE

  const showToast = (type: 'success' | 'error', message: string) => {
    clearTimeout(toastTimer.current)
    setToast({ type, message, visible: true })
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, visible: false })), 3500)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const result = await saveSpecialPredictions({
        championTeam: championName ?? null,
        topScorer: scorer.trim() || null,
      })
      if (result.error) throw new Error(result.error)
      showToast('success', '¡Predicciones actualizadas!')
      setEditing(false)
    } catch (err) {
      console.error('[EspecialesTab] save:', err)
      showToast('error', 'Error al guardar. Intentá de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  const cancelEdit = () => {
    setEditing(false)
    setChampionTla(getTla(championTeam))
    setChampionName(championTeam)
    setScorer(topScorer ?? '')
  }

  const championFlagUrl = championTla ? getFlagUrl(championTla) : null
  const scorerData      = STRIKERS.find(s => s.name === scorer.trim())
  const scorerFlagUrl   = scorerData ? `https://flagcdn.com/w40/${scorerData.code}.png` : null

  const GOLD = '#F6B73C'
  const BLUE = '#60a5fa'

  const CARD_GOLD: React.CSSProperties = {
    background: 'rgba(246,183,60,0.04)',
    border: `1px solid rgba(246,183,60,0.22)`,
    borderRadius: 24,
    padding: 24,
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  }
  const CARD_BLUE: React.CSSProperties = {
    background: 'rgba(96,165,250,0.04)',
    border: `1px solid rgba(96,165,250,0.22)`,
    borderRadius: 24,
    padding: 24,
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  }
  const CARD_EDIT: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 24,
    padding: 24,
  }

  return (
    <div>
      {onTabChange && (
        <button
          onClick={() => onTabChange('perfil')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.45)', fontSize: 13, padding: '0 0 20px', transition: 'color 0.15s' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}
        >
          <ArrowLeft size={15} /> Mi Perfil
        </button>
      )}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-montserrat, system-ui)', margin: 0, marginBottom: 4, letterSpacing: '-0.01em' }}>
          Mis Especiales
        </h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.40)', margin: 0 }}>
          Mundial 2026 · Hasta 24 puntos
        </p>
      </div>

      {!editing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* ── CARDS 2 COLUMNAS ─────────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* CAMPEÓN */}
            <div style={CARD_GOLD}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <Trophy style={{ width: 14, height: 14, color: GOLD, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', color: GOLD, textTransform: 'uppercase' }}>
                    Campeón
                  </span>
                </div>
                <span style={{ background: 'rgba(246,183,60,0.15)', color: GOLD, padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 800 }}>
                  +12 pts
                </span>
              </div>

              {/* Contenido */}
              {championName && championFlagUrl ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '8px 0' }}>
                  <img
                    src={championFlagUrl}
                    alt={championName}
                    style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 14, border: '1px solid rgba(255,255,255,0.14)', boxShadow: '0 4px 24px rgba(0,0,0,0.30)' }}
                  />
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: 0, marginBottom: 3 }}>{championName}</p>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)', margin: 0 }}>Tu campeón del Mundial 2026</p>
                  </div>
                </div>
              ) : (
                <EmptyCard color={GOLD} label="Sin predicción — elegí tu campeón" />
              )}
            </div>

            {/* GOLEADOR */}
            <div style={CARD_BLUE}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <Target style={{ width: 14, height: 14, color: BLUE, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', color: BLUE, textTransform: 'uppercase' }}>
                    Goleador
                  </span>
                </div>
                <span style={{ background: 'rgba(96,165,250,0.15)', color: BLUE, padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 800 }}>
                  +12 pts
                </span>
              </div>

              {/* Contenido */}
              {scorer.trim() ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '8px 0' }}>
                  <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(96,165,250,0.15)', border: '2px solid rgba(96,165,250,0.40)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 900, color: BLUE }}>
                    {scorer.trim()[0]?.toUpperCase()}
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: 0, marginBottom: 8 }}>{scorer.trim()}</p>
                    {scorerData && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                        {scorerFlagUrl && (
                          <img src={scorerFlagUrl} alt={scorerData.country} style={{ width: 22, height: 15, objectFit: 'cover', borderRadius: 3, border: '1px solid rgba(255,255,255,0.12)' }} />
                        )}
                        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>{scorerData.country}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <EmptyCard color={BLUE} label="Sin predicción — elegí tu goleador" />
              )}
            </div>
          </div>

          {/* ── ESTADO + EDITAR en una fila ──────────────────────────────── */}
          {isClosed ? (
            <div style={{ textAlign: 'center', padding: '14px 20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.35)', margin: 0 }}>
                Predicciones cerradas · Fase de grupos finalizada
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, background: 'rgba(246,183,60,0.06)', border: '1px solid rgba(246,183,60,0.18)', borderRadius: 16, padding: '14px 20px' }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: GOLD, margin: 0, marginBottom: 2 }}>
                  Podés cambiar tu predicción
                </p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: 0 }}>
                  Cierra el 26 de junio
                </p>
              </div>
              <button
                onClick={() => setEditing(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.70)', fontSize: 13, fontWeight: 600, cursor: 'pointer', flexShrink: 0, transition: 'background 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.10)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
              >
                <Edit2 style={{ width: 13, height: 13 }} />
                Editar
              </button>
            </div>
          )}
        </div>

      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* ── CARD CAMPEÓN (edit) ─────────────────────────────────────── */}
          <div style={CARD_EDIT}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Trophy style={{ width: 15, height: 15, color: GOLD }} />
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', color: GOLD, textTransform: 'uppercase' }}>Campeón del Mundial</span>
            </div>
            <TeamDropdown
              value={championTla}
              onChange={(tla, name) => { setChampionTla(tla); setChampionName(name) }}
              disabled={saving}
            />
          </div>

          {/* ── CARD GOLEADOR (edit) ─────────────────────────────────────── */}
          <div style={CARD_EDIT}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Target style={{ width: 15, height: 15, color: BLUE }} />
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', color: BLUE, textTransform: 'uppercase' }}>Goleador del Torneo</span>
            </div>

            {scorer.trim() && scorerData ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: 'rgba(96,165,250,0.06)', borderRadius: 14, border: '1px solid rgba(96,165,250,0.25)' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(96,165,250,0.15)', border: '2px solid rgba(96,165,250,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, color: BLUE, flexShrink: 0 }}>
                  {scorer.trim()[0]?.toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 15, fontWeight: 800, color: '#fff', margin: 0, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {scorer.trim()}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {scorerFlagUrl && (
                      <img src={scorerFlagUrl} alt={scorerData.country} style={{ width: 20, height: 13, objectFit: 'cover', borderRadius: 2, border: '1px solid rgba(255,255,255,0.10)' }} />
                    )}
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>{scorerData.country}</span>
                  </div>
                </div>
                {!saving && (
                  <button
                    type="button"
                    onClick={() => setScorer('')}
                    style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                  >
                    <X style={{ width: 13, height: 13, color: 'rgba(255,255,255,0.50)' }} />
                  </button>
                )}
              </div>
            ) : (
              <ScorerCombobox value={scorer} onChange={setScorer} disabled={saving} />
            )}
          </div>

          {/* ── Acciones ─────────────────────────────────────────────────── */}
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={cancelEdit}
              style={{ padding: '12px 20px', borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.55)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', borderRadius: 14, background: saving ? 'rgba(0,106,51,0.30)' : '#006A33', border: 'none', color: '#fff', fontSize: 14, fontWeight: 800, cursor: saving ? 'not-allowed' : 'pointer', boxShadow: saving ? 'none' : '0 4px 20px rgba(0,106,51,0.35)' }}
            >
              {saving
                ? <><Loader2 style={{ width: 15, height: 15, animation: 'spin 1s linear infinite' }} />Guardando...</>
                : <><Check style={{ width: 15, height: 15 }} />Guardar cambios</>}
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      <AnimatePresence>
        {toast.visible && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 500, damping: 32 }}
            style={{
              position: 'fixed', bottom: 24, right: 24, zIndex: 10000,
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 18px', borderRadius: 14, fontSize: 13, fontWeight: 500,
              background: toast.type === 'success' ? 'rgba(34,197,94,0.13)' : 'rgba(239,68,68,0.13)',
              border: `1px solid ${toast.type === 'success' ? 'rgba(34,197,94,0.35)' : 'rgba(239,68,68,0.35)'}`,
              backdropFilter: 'blur(16px)',
              color: toast.type === 'success' ? '#22c55e' : '#ef4444',
              boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
            }}
          >
            {toast.type === 'success'
              ? <Check style={{ width: 15, height: 15, flexShrink: 0 }} />
              : <AlertCircle style={{ width: 15, height: 15, flexShrink: 0 }} />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
