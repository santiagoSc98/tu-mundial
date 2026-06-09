'use client'

import { useState, useRef, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Check, Loader2, ArrowRight, Search } from 'lucide-react'
import TeamDropdown from '@/components/TeamDropdown'
import { STRIKERS } from '@/lib/strikers'
import PlayerAvatar from '@/components/PlayerAvatar'

// ─── Google icon ──────────────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" style={{ width: 18, height: 18, flexShrink: 0 }}>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function flagUrl(code: string) {
  return `https://flagcdn.com/w40/${code}.png`
}

// ─── Player row ───────────────────────────────────────────────────────────────

function PlayerRow({
  player,
  selected,
  flagErr,
  onFlagErr,
  onClick,
}: {
  player:    { name: string; country: string; code: string; photo?: string | null }
  selected:  boolean
  flagErr:   boolean
  onFlagErr: () => void
  onClick:   () => void
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="w-full flex items-center gap-3 text-left"
      style={{
        height:     64,
        padding:    '0 14px',
        background: selected ? 'rgba(0,106,51,0.18)' : hovered ? 'rgba(255,255,255,0.05)' : 'transparent',
        border:     'none',
        cursor:     'pointer',
        transition: 'background 0.10s ease',
      }}
    >
      {/* <PlayerAvatar name={player.name} code={player.code} photo={player.photo} size={40} /> */}
          {!flagErr && (
            <img
              src={flagUrl(player.code)}
              alt={player.country}
              onError={onFlagErr}
              style={{ width: 36, height: 22, objectFit: 'cover', borderRadius: 2, flexShrink: 0 }}
            />
          )}
      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate" style={{ color: selected ? '#22c55e' : '#fff', fontSize: 14 }}>
          {player.name}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="truncate" style={{ color: 'rgba(255,255,255,0.38)', fontSize: 12 }}>{player.country}</span>
        </div>
      </div>
      {selected && (
        <div className="flex items-center justify-center shrink-0 rounded-full" style={{ width: 20, height: 20, background: '#22c55e' }}>
          <Check className="h-3 w-3 text-white" strokeWidth={3} />
        </div>
      )}
    </button>
  )
}

// ─── Login card ───────────────────────────────────────────────────────────────

function LoginCard({ onLogin }: { onLogin: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.24, ease: 'easeInOut' }}
    >
      <p className="text-base font-bold mb-1" style={{ color: '#fff' }}>Empieza a competir</p>
      <p className="text-xs mb-8" style={{ color: 'rgba(255,255,255,0.40)' }}>
        Inicia sesión para guardar tus predicciones del Mundial 2026
      </p>

      <motion.button
        onClick={onLogin}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        className="flex items-center justify-center gap-3 w-full font-bold"
        style={{
          height: 56, background: '#0052A5',
          color: '#fff', border: 'none', borderRadius: 16,
          cursor: 'pointer', fontSize: 15,
          boxShadow: '0 4px 20px rgba(0,82,165,0.35)',
        }}
      >
        <GoogleIcon /> Entrar con Google
      </motion.button>

      <p className="text-center mt-4 text-xs" style={{ color: 'rgba(255,255,255,0.20)' }}>
        Gratis · Sin descargas
      </p>
    </motion.div>
  )
}

// ─── Selection card ───────────────────────────────────────────────────────────

function SelectionCard({
  championTla,
  topScorer,
  onChampionChange,
  onScorerChange,
  onSave,
  saving,
}: {
  championTla:      string | null
  topScorer:        string
  onChampionChange: (tla: string, name: string) => void
  onScorerChange:   (name: string) => void
  onSave:           () => void
  saving:           boolean
}) {
  const [search,     setSearch]     = useState('')
  const [flagErrors, setFlagErrors] = useState<Record<string, boolean>>({})

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return q
      ? STRIKERS.filter(p => p.name.toLowerCase().includes(q) || p.country.toLowerCase().includes(q))
      : STRIKERS
  }, [search])

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.24, ease: 'easeInOut' }}
    >
      <p className="text-base font-bold mb-1" style={{ color: '#fff' }}>Personaliza tu experiencia</p>
      <p className="text-xs mb-6" style={{ color: 'rgba(255,255,255,0.40)' }}>
        Elige tu campeón y goleador del Mundial 2026
      </p>

      {/* Champion */}
      <div className="mb-5">
        <p className="text-xs font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.55)', letterSpacing: '0.05em' }}>
          CAMPEÓN DEL MUNDIAL
        </p>
        <TeamDropdown value={championTla} onChange={onChampionChange} disabled={false} variant="dark" />
      </div>

      {/* Scorer */}
      <div className="mb-6">
        <p className="text-xs font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.55)', letterSpacing: '0.05em' }}>
          GOLEADOR DEL MUNDIAL
        </p>

        <div className="relative mb-2">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'rgba(255,255,255,0.30)', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Buscar jugador o selección..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full outline-none"
            style={{
              height: 56, paddingLeft: 44, paddingRight: 40,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.10)',
              borderRadius: 14, color: '#fff', fontSize: 14, caretColor: '#006A33',
            }}
          />
          {(search || topScorer) && (
            <button
              onClick={() => { onScorerChange(''); setSearch('') }}
              className="absolute right-4 top-1/2 -translate-y-1/2"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.40)', fontSize: 18, lineHeight: 1 }}
            >
              ×
            </button>
          )}
        </div>

        {topScorer && !search && (
          <div className="flex items-center gap-2 mb-2 px-3 py-1.5 rounded-xl" style={{ background: 'rgba(0,106,51,0.15)', border: '1px solid rgba(0,106,51,0.30)' }}>
            <Check className="h-3.5 w-3.5 shrink-0" style={{ color: '#22c55e' }} />
            <span className="text-sm font-semibold truncate" style={{ color: '#22c55e' }}>{topScorer}</span>
          </div>
        )}

        <div style={{ maxHeight: 260, overflowY: 'auto', borderRadius: 14, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.20)' }}>
          {filtered.length === 0 ? (
            <div className="flex items-center justify-center" style={{ height: 80, color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>
              Sin resultados
            </div>
          ) : filtered.map((player, i) => (
            <div key={player.name} style={{ borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
              <PlayerRow
                player={player}
                selected={topScorer === player.name}
                flagErr={!!flagErrors[player.code]}
                onFlagErr={() => setFlagErrors(e => ({ ...e, [player.code]: true }))}
                onClick={() => onScorerChange(topScorer === player.name ? '' : player.name)}
              />
            </div>
          ))}
        </div>
      </div>

      <motion.button
        onClick={onSave}
        disabled={saving}
        whileHover={!saving ? { scale: 1.02 } : {}}
        whileTap={!saving ? { scale: 0.97 } : {}}
        className="flex items-center justify-center gap-2 w-full font-bold"
        style={{
          height: 56, background: saving ? 'rgba(0,106,51,0.40)' : '#006A33',
          color: '#fff', border: 'none', borderRadius: 16,
          cursor: saving ? 'not-allowed' : 'pointer', fontSize: 16,
          transition: 'background 0.15s ease',
        }}
      >
        {saving
          ? <><Loader2 className="h-4 w-4 animate-spin" /> Guardando...</>
          : <>Guardar y continuar <ArrowRight className="h-4 w-4" /></>
        }
      </motion.button>
    </motion.div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  userId: string | null
}

export default function OnboardingClient({ userId }: Props) {
  const [championTla,  setChampionTla]  = useState<string | null>(null)
  const [championName, setChampionName] = useState<string | null>(null)
  const [topScorer,    setTopScorer]    = useState('')
  const [saving,       setSaving]       = useState(false)

  const router   = useRouter()
  const supabase = useRef(createClient()).current

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options:  { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  const handleSave = async () => {
    if (!userId) return
    setSaving(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('special_predictions')
      .upsert({
        user_id:       userId,
        champion_team: championName ?? null,
        top_scorer:    topScorer.trim() || null,
      }, { onConflict: 'user_id' })

    if (error) {
      console.error('[OnboardingClient] save error:', error)
      alert('Error al guardar: ' + error.message)
      setSaving(false)
      return
    }
    router.push('/home')
  }

  const card = userId ? (
    <SelectionCard
      championTla={championTla}
      topScorer={topScorer}
      onChampionChange={(tla, name) => { setChampionTla(tla); setChampionName(name) }}
      onScorerChange={setTopScorer}
      onSave={handleSave}
      saving={saving}
    />
  ) : (
    <LoginCard onLogin={handleLogin} />
  )

  return (
    <div className="relative min-h-screen" style={{ background: '#010b1f' }}>
      <div className="relative z-10 flex min-h-screen items-center justify-center px-5 py-10 lg:px-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center w-full" style={{ maxWidth: 1100 }}>

          {/* ── Left hero (desktop only) ─────────────────────── */}
          <div className="hidden lg:block text-left space-y-6">
            <div className="flex" style={{ alignItems: 'flex-end' }}>
              <img src="/logo-mundial.png" alt="Mundial 2026" style={{ height: 180, objectFit: 'contain', marginRight: 10 }} />
              <div>
                <p className="text-lg" style={{ color: '#9CA3AF' }}>Bienvenido a</p>
                <h1
                  className="text-4xl font-bold leading-none"
                  style={{ fontFamily: 'var(--font-montserrat, system-ui)', color: '#fff' }}
                >
                  TU MUNDIAL
                </h1>
                <p
                  className="text-3xl font-bold mt-1"
                  style={{ fontFamily: 'var(--font-montserrat, system-ui)', color: '#006A33' }}
                >
                  Tus Predicciones.
                </p>
              </div>
            </div>

            <h2 className="text-2xl font-semibold" style={{ color: '#fff' }}>
              Predice. Compite. Gana.
            </h2>

            <p className="text-lg" style={{ color: '#9CA3AF' }}>
              Elegí tu campeón y goleador antes de que<br />
              empiece el Mundial · Predecí resultados partido<br />
              a partido · Competí con amigos.
            </p>
          </div>

          {/* ── Right: card ──────────────────────────────────── */}
          <div className="flex flex-col items-center lg:items-start w-full">
            {/* Mobile logo */}
            <div className="lg:hidden flex flex-col items-center gap-3 mb-7 text-center">
              <img src="/logo-mundial.png" alt="Mundial 2026" style={{ width: 88, height: 88, objectFit: 'contain' }} />
              <div>
                <h1
                  className="font-bold"
                  style={{ fontFamily: 'var(--font-montserrat, system-ui)', fontSize: 34, color: '#fff', letterSpacing: '-0.02em' }}
                >
                  TU MUNDIAL
                </h1>
                <p className="text-lg font-bold" style={{ color: '#006A33' }}>Tus Predicciones.</p>
              </div>
            </div>

            {/* Card */}
            <div
              style={{
                background:           'rgba(255,255,255,0)',
                backdropFilter:       'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border:               '1px solid rgba(255,255,255,0.08)',
                borderRadius:         24,
                padding:              32,
                width:                '100%',
                maxWidth:             440,
              }}
            >
              {card}
            </div>

            <p className="text-center mt-5 text-xs" style={{ color: 'rgba(255,255,255,0.15)' }}>
              Mundial 2026 · Gratis · Sin descargas
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
