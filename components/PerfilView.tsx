'use client'

import { useState } from 'react'
import { ArrowLeft, Camera, ClipboardList, Star, BookOpen, Settings2, Shield, ChevronRight, LogOut, Edit2 } from 'lucide-react'
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
  isAdmin: boolean
  onTabChange: (tab: string) => void
  onSignOut: () => void
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

function StatMini({ num, label, color }: { num: number | string; label: string; color?: 'green' | 'gold' | 'blue' }) {
  const textColor = color === 'green' ? '#4ade80' : color === 'gold' ? '#F6B73C' : color === 'blue' ? '#60a5fa' : '#fff'
  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ fontSize: 20, fontWeight: 900, color: textColor, margin: 0, letterSpacing: '-0.02em', lineHeight: 1 }}>{num}</p>
      <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.40)', margin: '3px 0 0', fontWeight: 600, letterSpacing: '0.04em' }}>{label}</p>
    </div>
  )
}

function MenuItem({
  icon, iconBg, label, onClick, href, border = true,
}: {
  icon: React.ReactNode
  iconBg?: 'blue' | 'gold' | 'green' | 'red'
  label: string
  onClick?: () => void
  href?: string
  border?: boolean
}) {
  const bgMap = { blue: 'rgba(96,165,250,0.15)', gold: 'rgba(246,183,60,0.15)', green: 'rgba(0,106,51,0.20)', red: 'rgba(206,17,38,0.15)' }
  const colorMap = { blue: '#60a5fa', gold: '#F6B73C', green: '#4ade80', red: '#f87171' }
  const iconStyle: React.CSSProperties = {
    width: 32, height: 32, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    background: iconBg ? bgMap[iconBg] : 'rgba(255,255,255,0.08)',
    color: iconBg ? colorMap[iconBg] : 'rgba(255,255,255,0.55)',
  }
  const rowStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', cursor: 'pointer', width: '100%',
    borderBottom: border ? '1px solid rgba(255,255,255,0.05)' : 'none',
    background: 'transparent', textDecoration: 'none',
  }
  const inner = (
    <>
      <div style={iconStyle}>{icon}</div>
      <span style={{ flex: 1, fontSize: 14, color: '#fff', fontWeight: 500, textAlign: 'left' }}>{label}</span>
      <ChevronRight size={15} style={{ color: 'rgba(255,255,255,0.25)', flexShrink: 0 }} />
    </>
  )
  if (href) return <a href={href} target="_blank" rel="noopener noreferrer" style={rowStyle}>{inner}</a>
  return <button type="button" onClick={onClick} style={{ ...rowStyle, border: 'none' }}>{inner}</button>
}

const INPUT_STYLE: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 12,
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
  color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box',
}

export default function PerfilView({ profile: initialProfile, myStats, currentStreak, isAdmin, onTabChange, onSignOut }: Props) {
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
          reader.onload = () => resolve((reader.result as string).split(',')[1])
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

  const avatarSrc   = previewUrl ?? profile.avatar_url ?? '/logo-mundial.png'
  const displayName = profile.username ?? 'Jugador'
  const handle      = '@' + (profile.username ?? 'jugador').toLowerCase().replace(/\s/g, '')

  // ── EDIT MODE ────────────────────────────────────────────────────────────────
  if (isEditing) {
    return (
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <button
            onClick={() => setIsEditing(false)}
            style={{ width: 36, height: 36, borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.70)', flexShrink: 0 }}
          >
            <ArrowLeft size={16} />
          </button>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: 0 }}>Editar perfil</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 24, padding: 20, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20 }}>
          <div style={{ position: 'relative' }}>
            <img src={avatarSrc} alt={displayName} style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(0,106,51,0.60)', display: 'block' }} />
            <label htmlFor="avatar-upload" style={{ position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, background: '#006A33', borderRadius: '50%', border: '2px solid #0B132B', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <Camera size={12} color="#fff" />
            </label>
            <input id="avatar-upload" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
          </div>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: 0 }}>Tocá la cámara para cambiar tu foto</p>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', display: 'block', marginBottom: 6, fontWeight: 600 }}>Nombre de usuario</label>
          <input value={editName} onChange={e => setEditName(e.target.value)} maxLength={30} autoFocus style={INPUT_STYLE} />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', display: 'block', marginBottom: 8, fontWeight: 600 }}>País</label>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
            {COUNTRIES.map(c => {
              const selected = editCountry === c.name
              return (
                <button key={c.name} type="button" onClick={() => setEditCountry(c.name)}
                  style={{ flexShrink: 0, padding: '8px 14px', borderRadius: 20, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s', fontWeight: selected ? 700 : 400, background: selected ? 'rgba(0,106,51,0.20)' : 'rgba(255,255,255,0.04)', border: selected ? '1px solid rgba(0,106,51,0.60)' : '1px solid rgba(255,255,255,0.08)', color: selected ? '#4ade80' : 'rgba(255,255,255,0.70)' }}>
                  {c.flag} {c.name}
                </button>
              )
            })}
          </div>
        </div>

        {error && <p style={{ fontSize: 13, color: '#f87171', margin: '0 0 16px' }}>{error}</p>}

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => setIsEditing(false)} style={{ flex: 1, padding: '13px', borderRadius: 16, background: 'transparent', border: '1px solid rgba(255,255,255,0.10)', cursor: 'pointer', color: 'rgba(255,255,255,0.60)', fontSize: 14, fontWeight: 600 }}>Cancelar</button>
          <button onClick={handleSave} disabled={!editName.trim() || isSaving} style={{ flex: 1, padding: '13px', borderRadius: 16, background: editName.trim() && !isSaving ? '#006A33' : 'rgba(255,255,255,0.06)', border: 'none', cursor: editName.trim() && !isSaving ? 'pointer' : 'not-allowed', color: '#fff', fontSize: 14, fontWeight: 700, transition: 'background 0.15s' }}>
            {isSaving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>

        {toast && <div style={{ position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', background: '#006A33', color: '#fff', padding: '12px 24px', borderRadius: 12, fontSize: 14, fontWeight: 700, zIndex: 10000, boxShadow: '0 4px 20px rgba(0,0,0,0.4)', whiteSpace: 'nowrap' }}>✓ {toast}</div>}
      </div>
    )
  }

  // ── VIEW MODE ────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 480, margin: '0 auto' }}>

      {/* Hero card */}
      <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 20, marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <img src={profile.avatar_url ?? '/logo-mundial.png'} alt={displayName} style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(0,106,51,0.60)', flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 17, fontWeight: 700, color: '#fff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: '1px 0 3px' }}>{handle}</p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', margin: 0 }}>{countryFlag(profile.country)} {profile.country ?? 'Paraguay'}</p>
          </div>
          <button onClick={openEdit} style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.55)', flexShrink: 0 }}>
            <Edit2 size={14} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          <StatMini num={myStats.totalPredictions}  label="Pred." />
          <StatMini num={myStats.correctPredictions} label="Aciertos" color="green" />
          <StatMini num={(profile.total_points ?? 0).toLocaleString('es-PY')} label="Puntos" color="gold" />
          <StatMini num={`#${myStats.rank}`}         label="Posición" color="blue" />
        </div>
      </div>

      {/* Streak */}
      {currentStreak > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'rgba(246,183,60,0.10)', border: '1px solid rgba(246,183,60,0.20)', borderRadius: 14, padding: '10px 16px', marginBottom: 12 }}>
          <span>🔥</span>
          <span style={{ fontSize: 13, color: '#F6B73C', fontWeight: 600 }}>{currentStreak} {currentStreak === 1 ? 'acierto' : 'aciertos'} seguidos</span>
        </div>
      )}

      {/* MI CUENTA */}
      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.35)', margin: '0 0 8px 4px' }}>MI CUENTA</p>
      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, overflow: 'hidden', marginBottom: 12 }}>
        <MenuItem icon={<ClipboardList size={16} />} iconBg="blue" label="Mis Predicciones" onClick={() => onTabChange('mis-predicciones')} />
        <MenuItem icon={<Star size={16} />}          iconBg="gold" label="Mis Especiales"   onClick={() => onTabChange('especiales')} border={false} />
      </div>

      {/* APP */}
      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.35)', margin: '0 0 8px 4px' }}>APP</p>
      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, overflow: 'hidden', marginBottom: 16 }}>
        <MenuItem icon={<BookOpen size={16} />} label="Reglas"     onClick={() => onTabChange('reglas')} />
        <MenuItem icon={<Shield size={16} />}   label="Privacidad" href="/privacidad" />
        {isAdmin && <MenuItem icon={<Settings2 size={16} />} label="Admin" onClick={() => onTabChange('admin')} border={false} />}
        {!isAdmin && <MenuItem icon={<Shield size={16} />}   label="Privacidad" href="/privacidad" border={false} />}
      </div>

      {/* Sign out */}
      <button
        onClick={onSignOut}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'rgba(206,17,38,0.08)', border: '1px solid rgba(206,17,38,0.15)', borderRadius: 16, cursor: 'pointer' }}
      >
        <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(206,17,38,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <LogOut size={15} style={{ color: '#f87171' }} />
        </div>
        <span style={{ fontSize: 14, color: '#f87171', fontWeight: 500 }}>Cerrar sesión</span>
      </button>

      {toast && <div style={{ position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', background: '#006A33', color: '#fff', padding: '12px 24px', borderRadius: 12, fontSize: 14, fontWeight: 700, zIndex: 10000, boxShadow: '0 4px 20px rgba(0,0,0,0.4)', whiteSpace: 'nowrap' }}>✓ {toast}</div>}
    </div>
  )
}
