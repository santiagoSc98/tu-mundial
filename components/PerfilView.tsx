'use client'

import { useState } from 'react'
import { ArrowLeft, Camera } from 'lucide-react'
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
  { name: 'Paraguay',  flag: '🇵🇾' },
  { name: 'Argentina', flag: '🇦🇷' },
  { name: 'Brasil',    flag: '🇧🇷' },
  { name: 'Uruguay',   flag: '🇺🇾' },
  { name: 'Chile',     flag: '🇨🇱' },
  { name: 'Colombia',  flag: '🇨🇴' },
  { name: 'Perú',      flag: '🇵🇪' },
  { name: 'México',    flag: '🇲🇽' },
  { name: 'Venezuela', flag: '🇻🇪' },
  { name: 'Ecuador',   flag: '🇪🇨' },
  { name: 'Bolivia',   flag: '🇧🇴' },
  { name: 'España',    flag: '🇪🇸' },
  { name: 'USA',       flag: '🇺🇸' },
  { name: 'Otro',      flag: '🌍' },
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

export default function PerfilView({ profile: initialProfile, myStats, currentStreak }: Props) {
  const [profile,     setProfile]     = useState(initialProfile)
  const [isEditing,   setIsEditing]   = useState(false)
  const [editName,    setEditName]    = useState(profile.username ?? '')
  const [editCountry, setEditCountry] = useState(profile.country ?? 'Paraguay')
  const [previewUrl,  setPreviewUrl]  = useState<string | null>(null)
  const [avatarFile,  setAvatarFile]  = useState<File | null>(null)
  const [isSaving,    setIsSaving]    = useState(false)
  const [error,       setError]       = useState<string | null>(null)
  const [toast,       setToast]       = useState<string | null>(null)

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const openEdit = () => {
    setEditName(profile.username ?? '')
    setEditCountry(profile.country ?? 'Paraguay')
    setPreviewUrl(null)
    setAvatarFile(null)
    setError(null)
    setIsEditing(true)
  }

  const handleSave = async () => {
    if (!editName.trim()) return
    setIsSaving(true)
    setError(null)
    try {
      let avatarBase64: string | undefined
      let avatarType: string | undefined

      if (avatarFile) {
        avatarType = avatarFile.type
        avatarBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => {
            const result = reader.result as string
            resolve(result.split(',')[1])
          }
          reader.onerror = reject
          reader.readAsDataURL(avatarFile)
        })
      }

      const result = await updateProfile({ username: editName.trim(), country: editCountry, avatarBase64, avatarType })
      if (result.error) throw new Error(result.error)

      setProfile(prev => ({
        ...prev,
        username: editName.trim(),
        country: editCountry,
        avatar_url: result.data?.avatar_url ?? prev.avatar_url,
      }))
      setIsEditing(false)
      setToast('¡Perfil actualizado!')
      setTimeout(() => setToast(null), 3000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar')
    } finally {
      setIsSaving(false)
    }
  }

  const avatarSrc  = previewUrl ?? profile.avatar_url ?? '/logo-mundial.png'
  const displayName = profile.username ?? 'Jugador'
  const handle      = '@' + (profile.username ?? 'jugador').toLowerCase().replace(/\s/g, '')

  // ── EDIT MODE ────────────────────────────────────────────────────────────────
  if (isEditing) {
    return (
      <div style={{ maxWidth: 480, margin: '0 auto' }}>

        {/* Header with back */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <button
            onClick={() => setIsEditing(false)}
            style={{ width: 36, height: 36, borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.70)', flexShrink: 0 }}
          >
            <ArrowLeft size={16} />
          </button>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: 0 }}>Editar perfil</h2>
        </div>

        {/* Avatar with camera */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 24, padding: 20, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20 }}>
          <div style={{ position: 'relative' }}>
            <img
              src={avatarSrc}
              alt={displayName}
              style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(0,106,51,0.60)', display: 'block' }}
            />
            <label
              htmlFor="avatar-upload"
              style={{ position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, background: '#006A33', borderRadius: '50%', border: '2px solid #0B132B', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <Camera size={12} color="#fff" />
            </label>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleAvatarChange}
            />
          </div>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: 0 }}>
            Tocá la cámara para cambiar tu foto
          </p>
        </div>

        {/* Nombre */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', display: 'block', marginBottom: 6, fontWeight: 600 }}>Nombre de usuario</label>
          <input
            value={editName}
            onChange={e => setEditName(e.target.value)}
            maxLength={30}
            autoFocus
            style={INPUT_STYLE}
          />
        </div>

        {/* País - scroll horizontal */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', display: 'block', marginBottom: 8, fontWeight: 600 }}>País</label>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
            {COUNTRIES.map(c => {
              const selected = editCountry === c.name
              return (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => setEditCountry(c.name)}
                  style={{ flexShrink: 0, padding: '8px 14px', borderRadius: 20, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s', fontWeight: selected ? 700 : 400, background: selected ? 'rgba(0,106,51,0.20)' : 'rgba(255,255,255,0.04)', border: selected ? '1px solid rgba(0,106,51,0.60)' : '1px solid rgba(255,255,255,0.08)', color: selected ? '#4ade80' : 'rgba(255,255,255,0.70)' }}
                >
                  {c.flag} {c.name}
                </button>
              )
            })}
          </div>
        </div>

        {error && <p style={{ fontSize: 13, color: '#f87171', margin: '0 0 16px' }}>{error}</p>}

        {/* Botones */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => setIsEditing(false)}
            style={{ flex: 1, padding: '13px', borderRadius: 16, background: 'transparent', border: '1px solid rgba(255,255,255,0.10)', cursor: 'pointer', color: 'rgba(255,255,255,0.60)', fontSize: 14, fontWeight: 600 }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!editName.trim() || isSaving}
            style={{ flex: 1, padding: '13px', borderRadius: 16, background: editName.trim() && !isSaving ? '#006A33' : 'rgba(255,255,255,0.06)', border: 'none', cursor: editName.trim() && !isSaving ? 'pointer' : 'not-allowed', color: '#fff', fontSize: 14, fontWeight: 700, transition: 'background 0.15s' }}
          >
            {isSaving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>

        {toast && (
          <div style={{ position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', background: '#006A33', color: '#fff', padding: '12px 24px', borderRadius: 12, fontSize: 14, fontWeight: 700, zIndex: 10000, boxShadow: '0 4px 20px rgba(0,0,0,0.4)', whiteSpace: 'nowrap' }}>
            ✓ {toast}
          </div>
        )}
      </div>
    )
  }

  // ── VIEW MODE ────────────────────────────────────────────────────────────────
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '20px' }}>
        <img
          src={profile.avatar_url ?? '/logo-mundial.png'}
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
            {countryFlag(profile.country)} {profile.country ?? 'Paraguay'}
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
        <StatBox num={(profile.total_points ?? 0).toLocaleString('es-PY')} label="Puntos" color="gold" />
        <StatBox num={`#${myStats.rank}`} label="Posición" color="blue" />
      </div>

      {/* Edit button */}
      <button
        onClick={openEdit}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px', borderRadius: 16, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', cursor: 'pointer', color: '#fff', fontSize: 14, fontWeight: 600 }}
      >
        ✏️ Editar perfil
      </button>

      {toast && (
        <div style={{ position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', background: '#006A33', color: '#fff', padding: '12px 24px', borderRadius: 12, fontSize: 14, fontWeight: 700, zIndex: 10000, boxShadow: '0 4px 20px rgba(0,0,0,0.4)', whiteSpace: 'nowrap' }}>
          ✓ {toast}
        </div>
      )}
    </div>
  )
}
