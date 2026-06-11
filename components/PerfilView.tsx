'use client'

import { useState } from 'react'
import { Edit2 } from 'lucide-react'
import { updateProfile } from '@/app/actions/profile'

interface Profile {
  id: string
  username: string | null
  avatar_url: string | null
  total_points: number
  current_streak: number
  country: string | null
}

interface Props {
  profile: Profile
  myStats: { totalPredictions: number; correctPredictions: number; rank: number }
  currentStreak: number
}

const COUNTRIES = [
  { name: 'Paraguay',   flag: '🇵🇾' },
  { name: 'Argentina',  flag: '🇦🇷' },
  { name: 'Brasil',     flag: '🇧🇷' },
  { name: 'Uruguay',    flag: '🇺🇾' },
  { name: 'Bolivia',    flag: '🇧🇴' },
  { name: 'Chile',      flag: '🇨🇱' },
  { name: 'Colombia',   flag: '🇨🇴' },
  { name: 'Perú',       flag: '🇵🇪' },
  { name: 'México',     flag: '🇲🇽' },
  { name: 'Venezuela',  flag: '🇻🇪' },
  { name: 'Ecuador',    flag: '🇪🇨' },
  { name: 'España',     flag: '🇪🇸' },
]

function countryFlag(country: string | null) {
  return COUNTRIES.find(c => c.name === country)?.flag ?? '🌍'
}

function StatBox({ num, label, color }: { num: number | string; label: string; color?: 'green' | 'gold' | 'blue' }) {
  const textColor = color === 'green' ? '#4ade80' : color === 'gold' ? '#F6B73C' : color === 'blue' ? '#60a5fa' : '#fff'
  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '16px 12px', textAlign: 'center' }}>
      <p style={{ fontSize: 24, fontWeight: 900, color: textColor, margin: 0, letterSpacing: '-0.02em' }}>{num}</p>
      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)', margin: '4px 0 0', fontWeight: 600, letterSpacing: '0.04em' }}>{label}</p>
    </div>
  )
}

const INPUT_STYLE: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 12,
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
  color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box',
}

export default function PerfilView({ profile, myStats, currentStreak }: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [editName,    setEditName]    = useState(profile.username ?? '')
  const [editCountry, setEditCountry] = useState(profile.country ?? 'Paraguay')
  const [localProfile, setLocalProfile] = useState(profile)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [toast,   setToast]   = useState<string | null>(null)

  const handleSave = async () => {
    if (!editName.trim()) return
    setLoading(true)
    setError(null)
    try {
      const result = await updateProfile({ username: editName.trim(), country: editCountry })
      if (result.error) throw new Error(result.error)
      setLocalProfile(prev => ({ ...prev, username: editName.trim(), country: editCountry }))
      setIsEditing(false)
      setToast('¡Perfil actualizado!')
      setTimeout(() => setToast(null), 3000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  const avatarSrc = localProfile.avatar_url ?? '/logo-mundial.png'
  const displayName = localProfile.username ?? 'Jugador'
  const handle = '@' + (localProfile.username ?? 'jugador').toLowerCase().replace(/\s/g, '')

  return (
    <div style={{ maxWidth: 480, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#fff', margin: 0, marginBottom: 4, fontFamily: 'var(--font-montserrat, system-ui)', letterSpacing: '-0.01em' }}>
          Mi Perfil
        </h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.40)', margin: 0 }}>
          Tus estadísticas y configuración
        </p>
      </div>

      {/* Avatar + info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '20px 20px' }}>
        <img
          src={avatarSrc}
          alt={displayName}
          style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(0,106,51,0.60)', flexShrink: 0 }}
        />
        <div style={{ minWidth: 0 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {displayName}
          </h2>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: '2px 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {handle}
          </p>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.70)', margin: 0 }}>
            {countryFlag(localProfile.country)} {localProfile.country ?? 'Paraguay'}
          </p>
          {currentStreak > 0 && (
            <p style={{ fontSize: 12, color: '#F6B73C', margin: '4px 0 0', fontWeight: 600 }}>
              🔥 {currentStreak} {currentStreak === 1 ? 'acierto' : 'aciertos'} seguidos
            </p>
          )}
        </div>
      </div>

      {/* Stats 2×2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
        <StatBox num={myStats.totalPredictions} label="Predicciones" />
        <StatBox num={myStats.correctPredictions} label="Aciertos" color="green" />
        <StatBox num={(localProfile.total_points ?? 0).toLocaleString('es-PY')} label="Puntos" color="gold" />
        <StatBox num={`#${myStats.rank}`} label="Posición" color="blue" />
      </div>

      {/* Edit form */}
      {!isEditing ? (
        <button
          onClick={() => { setIsEditing(true); setError(null) }}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px', borderRadius: 16, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', cursor: 'pointer', color: '#fff', fontSize: 14, fontWeight: 600, marginBottom: 4 }}
        >
          <Edit2 size={15} />
          Editar perfil
        </button>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          <div>
            <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', display: 'block', marginBottom: 6 }}>Nombre de usuario</label>
            <input
              value={editName}
              onChange={e => setEditName(e.target.value)}
              maxLength={30}
              autoFocus
              style={INPUT_STYLE}
            />
          </div>

          <div>
            <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', display: 'block', marginBottom: 8 }}>País</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {COUNTRIES.map(c => {
                const selected = editCountry === c.name
                return (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setEditCountry(c.name)}
                    style={{ padding: '8px 12px', borderRadius: 12, fontSize: 13, cursor: 'pointer', textAlign: 'left', fontWeight: selected ? 700 : 400, transition: 'all 0.15s', background: selected ? 'rgba(0,106,51,0.20)' : 'rgba(255,255,255,0.04)', border: selected ? '1px solid rgba(0,106,51,0.60)' : '1px solid rgba(255,255,255,0.08)', color: selected ? '#4ade80' : 'rgba(255,255,255,0.70)' }}
                  >
                    {c.flag} {c.name}
                  </button>
                )
              })}
            </div>
          </div>

          {error && <p style={{ fontSize: 13, color: '#f87171', margin: 0 }}>{error}</p>}

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => { setIsEditing(false); setError(null) }}
              style={{ flex: 1, padding: '13px', borderRadius: 14, background: 'transparent', border: '1px solid rgba(255,255,255,0.10)', cursor: 'pointer', color: 'rgba(255,255,255,0.60)', fontSize: 14, fontWeight: 600 }}
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={!editName.trim() || loading}
              style={{ flex: 1, padding: '13px', borderRadius: 14, background: editName.trim() && !loading ? '#006A33' : 'rgba(255,255,255,0.06)', border: 'none', cursor: editName.trim() && !loading ? 'pointer' : 'not-allowed', color: '#fff', fontSize: 14, fontWeight: 700, transition: 'background 0.15s' }}
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', background: '#006A33', color: '#fff', padding: '12px 24px', borderRadius: 12, fontSize: 14, fontWeight: 700, zIndex: 10000, boxShadow: '0 4px 20px rgba(0,0,0,0.4)', whiteSpace: 'nowrap' }}>
          ✓ {toast}
        </div>
      )}
    </div>
  )
}
