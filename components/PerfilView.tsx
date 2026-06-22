'use client'

import { useState } from 'react'
import { ArrowLeft, Camera, ClipboardList, Star, BookOpen, Settings2, Shield, ChevronRight, LogOut, Edit2, Target, Flame, Crosshair, Trophy, ListChecks } from 'lucide-react'
import { updateProfile } from '@/app/actions/profile'
import { BADGES } from '@/lib/badges'

interface Profile {
  id: string
  username: string | null
  avatar_url: string | null
  total_points: number
  current_streak: number
  country: string | null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ICON_MAP: Record<string, any> = {
  target:       Target,
  flame:        Flame,
  crosshair:    Crosshair,
  trophy:       Trophy,
  'list-check': ListChecks,
}

interface Props {
  profile: Profile
  myStats: { totalPredictions: number; correctPredictions: number; rank: number }
  currentStreak: number
  isAdmin: boolean
  myBadges: { badge_id: string; unlocked_at: string }[]
  totalUsers?: number
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

export default function PerfilView({ profile: initialProfile, myStats, currentStreak, isAdmin, myBadges, totalUsers = 0, onTabChange, onSignOut }: Props) {
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

  const accuracy = myStats.totalPredictions > 0
    ? Math.round((myStats.correctPredictions / myStats.totalPredictions) * 100)
    : 0

  // ── VIEW MODE ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── MOBILE (unchanged) ── */}
      <div className="md:hidden" style={{ maxWidth: 480, margin: '0 auto' }}>

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

        {/* Logros */}
        {myBadges.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-gray-500 font-semibold mb-2 px-1">LOGROS</p>
            <div className="grid grid-cols-2 gap-2">
              {myBadges.map(badge => {
                const def = BADGES[badge.badge_id as keyof typeof BADGES]
                if (!def) return null
                const Icon = ICON_MAP[def.icon]
                return (
                  <div key={badge.badge_id} className="flex items-center gap-2.5 bg-white/[0.04] border border-white/[0.07] rounded-xl p-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[rgba(0,106,51,0.15)] flex items-center justify-center flex-shrink-0">
                      {Icon && <Icon size={15} className="text-[#00C46A]" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{def.name}</p>
                      <p className="text-[10px] text-gray-500 truncate">{def.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>
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
      </div>

      {/* ── DESKTOP ── */}
      <div className="hidden md:flex gap-5 max-w-5xl mx-auto">

        {/* COLUMNA PRINCIPAL */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">

          {/* HERO */}
          <div className="relative rounded-2xl overflow-hidden p-6" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="absolute inset-0 z-0" style={{ background: 'linear-gradient(135deg,#071A40,#0A2460 50%,#071A40)' }} />
            <div className="absolute inset-0 z-[1] opacity-[0.07]" style={{
              backgroundImage: `radial-gradient(circle at 50% 50%,transparent 38%,rgba(255,255,255,.8) 39%,transparent 40%),linear-gradient(rgba(255,255,255,.3) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.3) 1px,transparent 1px)`,
              backgroundSize: '100% 100%,40px 40px,40px 40px',
            }} />
            <div className="relative z-[2] flex items-center gap-5">
              <div className="relative flex-shrink-0">
                <img
                  src={profile.avatar_url ?? '/logo-mundial.png'}
                  alt={displayName}
                  className="w-20 h-20 rounded-full object-cover"
                  style={{ border: '3px solid #006A33' }}
                />
                <button
                  onClick={openEdit}
                  className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-[#006A33] flex items-center justify-center"
                >
                  <Edit2 size={11} className="text-white" />
                </button>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-white truncate">{displayName}</h2>
                <p className="text-xs text-gray-400 mt-0.5">{handle}</p>
                <p className="text-xs text-gray-300 mt-1">{countryFlag(profile.country)} {profile.country ?? 'Paraguay'}</p>
                {currentStreak > 0 && (
                  <div className="inline-flex items-center gap-1.5 mt-2.5 rounded-full px-3 py-1 text-xs font-medium"
                    style={{ background: 'rgba(246,183,60,0.12)', border: '1px solid rgba(246,183,60,0.25)', color: '#F6B73C' }}>
                    🔥 {currentStreak} {currentStreak === 1 ? 'acierto' : 'aciertos'} seguidos
                  </div>
                )}
              </div>
              <button
                onClick={openEdit}
                className="rounded-xl px-4 py-2 text-xs text-white self-start flex-shrink-0 transition hover:bg-white/[0.12]"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
              >
                Editar perfil
              </button>
            </div>
          </div>

          {/* MÉTRICAS */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { num: myStats.totalPredictions,  label: 'Predicciones', color: 'text-white',      icon: '📋' },
              { num: myStats.correctPredictions, label: 'Aciertos',     color: 'text-[#00C46A]',  icon: '✅' },
              { num: (profile.total_points ?? 0).toLocaleString('es-PY'), label: 'Puntos', color: 'text-[#F6B73C]', icon: '⚡' },
              { num: `#${myStats.rank}`,         label: 'Ranking',      color: 'text-[#4d9fff]',  icon: '🏅' },
            ].map(m => (
              <div key={m.label} className="rounded-2xl p-4 text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="text-lg mb-1">{m.icon}</div>
                <div className={`text-2xl font-bold ${m.color}`}>{m.num}</div>
                <div className="text-xs text-gray-400 mt-1">{m.label}</div>
              </div>
            ))}
          </div>

          {/* LOGROS */}
          {myBadges.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 font-semibold mb-3 tracking-wider">LOGROS</p>
              <div className="grid grid-cols-3 gap-2">
                {myBadges.map(badge => {
                  const def = BADGES[badge.badge_id as keyof typeof BADGES]
                  if (!def) return null
                  const Icon = ICON_MAP[def.icon]
                  return (
                    <div key={badge.badge_id} className="flex items-center gap-2.5 rounded-2xl p-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(0,106,51,0.15)' }}>
                        {Icon && <Icon size={15} className="text-[#00C46A]" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{def.name}</p>
                        <p className="text-[10px] text-gray-500 truncate">{def.description}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* MI CUENTA */}
          <div>
            <p className="text-xs text-gray-500 font-semibold mb-3 tracking-wider">MI CUENTA</p>
            <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <button onClick={() => onTabChange('mis-predicciones')}
                className="w-full flex items-center gap-3 p-4 transition hover:bg-white/[0.04]"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-sm" style={{ background: 'rgba(77,159,255,0.15)' }}>📄</div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-white">Mis Predicciones</p>
                  <p className="text-xs text-gray-400">Ver historial completo</p>
                </div>
                <ChevronRight size={14} className="text-gray-600" />
              </button>
              <button onClick={() => onTabChange('especiales')}
                className="w-full flex items-center gap-3 p-4 transition hover:bg-white/[0.04]">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-sm" style={{ background: 'rgba(246,183,60,0.15)' }}>⭐</div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-white">Mis Especiales</p>
                  <p className="text-xs text-gray-400">Campeón, goleador y más</p>
                </div>
                <ChevronRight size={14} className="text-gray-600" />
              </button>
            </div>
          </div>

          {/* CONFIGURACIÓN */}
          <div>
            <p className="text-xs text-gray-500 font-semibold mb-3 tracking-wider">CONFIGURACIÓN</p>
            <div className="grid grid-cols-3 gap-3">
              <button onClick={() => onTabChange('reglas')}
                className="rounded-2xl p-4 text-center transition hover:bg-white/[0.07]"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <BookOpen size={18} className="text-gray-400 mx-auto mb-2" />
                <p className="text-xs text-gray-300">Reglas</p>
              </button>
              <a href="/privacidad" target="_blank" rel="noopener noreferrer"
                className="rounded-2xl p-4 text-center transition hover:bg-white/[0.07]"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', display: 'block' }}>
                <Shield size={18} className="text-gray-400 mx-auto mb-2" />
                <p className="text-xs text-gray-300">Privacidad</p>
              </a>
              {isAdmin && (
                <button onClick={() => onTabChange('admin')}
                  className="rounded-2xl p-4 text-center transition hover:bg-white/[0.07]"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <Settings2 size={18} className="text-gray-400 mx-auto mb-2" />
                  <p className="text-xs text-gray-300">Admin</p>
                </button>
              )}
            </div>
          </div>

          {/* CERRAR SESIÓN */}
          <button onClick={onSignOut}
            className="flex items-center gap-3 p-4 rounded-2xl transition hover:bg-[rgba(206,17,38,0.14)]"
            style={{ background: 'rgba(206,17,38,0.08)', border: '1px solid rgba(206,17,38,0.20)' }}>
            <LogOut size={16} className="text-[#CE1126]" />
            <span className="text-sm text-[#CE1126] font-medium">Cerrar sesión</span>
          </button>

        </div>

        {/* SIDEBAR DERECHO */}
        <div className="w-64 flex-shrink-0 flex flex-col gap-4">

          {/* RENDIMIENTO */}
          <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-xs text-gray-500 font-semibold mb-3 tracking-wider">RENDIMIENTO</p>
            <div className="flex items-end gap-1 h-16 mb-1">
              {[30, 45, 55, 40, 70, 85, 100].map((h, i) => (
                <div key={i} className={`flex-1 rounded-t-sm ${h > 60 ? 'bg-[#006A33]' : 'bg-white/10'}`}
                  style={{ height: `${h}%` }} />
              ))}
            </div>
            <div className="flex gap-1 mb-3">
              {['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7'].map(d => (
                <div key={d} className="flex-1 text-center text-[9px] text-gray-600">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-sm font-semibold text-white">{myStats.totalPredictions}</p>
                <p className="text-[10px] text-gray-500">Pred.</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#00C46A]">{accuracy}%</p>
                <p className="text-[10px] text-gray-500">Efectividad</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#F6B73C]">{profile.total_points}</p>
                <p className="text-[10px] text-gray-500">Puntos</p>
              </div>
            </div>
          </div>

          {/* RANKING */}
          <div className="rounded-2xl p-4 text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-xs text-gray-500 font-semibold mb-3 tracking-wider">TU RANKING</p>
            <div className="text-3xl mb-2">
              {myStats.rank === 1 ? '🥇' : myStats.rank === 2 ? '🥈' : myStats.rank === 3 ? '🥉' : '🏅'}
            </div>
            <p className="text-3xl font-bold text-[#F6B73C]">#{myStats.rank}</p>
            {totalUsers > 0 && <p className="text-xs text-gray-500 mt-1">de {totalUsers} participantes</p>}
            <div className="mt-3 text-xs font-medium rounded-full px-3 py-1.5 inline-block"
              style={{ color: '#00C46A', background: 'rgba(0,196,106,0.10)', border: '1px solid rgba(0,196,106,0.20)' }}>
              {myStats.rank === 1 ? '¡Líder del ranking!' : '¡Seguí así!'}
            </div>
          </div>

          {/* COMPARTIR */}
          <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-xs text-gray-500 font-semibold mb-3 tracking-wider">COMPARTIR</p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  const text = encodeURIComponent(`Estoy #${myStats.rank} en Predique con ${profile.total_points} pts.\n¿Me podés superar?`)
                  window.open(`https://wa.me/?text=${text}`, '_blank')
                }}
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl text-xs font-medium transition hover:bg-[rgba(37,211,102,0.18)]"
                style={{ background: 'rgba(37,211,102,0.10)', border: '1px solid rgba(37,211,102,0.20)', color: '#25D366' }}>
                💬 Compartir en WhatsApp
              </button>
              <button
                onClick={() => navigator.clipboard.writeText(window.location.origin)}
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl text-xs text-gray-300 transition hover:bg-white/[0.08]"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)' }}>
                🔗 Copiar enlace
              </button>
            </div>
          </div>

        </div>
      </div>

      {toast && <div style={{ position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', background: '#006A33', color: '#fff', padding: '12px 24px', borderRadius: 12, fontSize: 14, fontWeight: 700, zIndex: 10000, boxShadow: '0 4px 20px rgba(0,0,0,0.4)', whiteSpace: 'nowrap' }}>✓ {toast}</div>}
    </>
  )
}
