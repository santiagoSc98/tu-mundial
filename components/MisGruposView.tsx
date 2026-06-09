'use client'

import { useState, useCallback } from 'react'
import { Users, Plus, Hash, Copy, ChevronRight, X, CheckCircle } from 'lucide-react'
import { createGroup, joinGroup, getGroupMembers } from '@/app/actions/groups'

export interface Group {
  id: string
  name: string
  code: string
  created_by: string
}

interface GroupMember {
  user_id: string
  username: string | null
  avatar_url: string | null
  total_points: number
}

interface Props {
  userId: string
  initialGroups: Group[]
}

const CARD: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 20,
}

function WhatsAppIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
}

const APP_URL = 'https://predique.vercel.app'

function shareText(code: string, groupName: string) {
  return `¡Unite a mi grupo "${groupName}" en TU MUNDIAL!\nUsá el código: *${code}*\n${APP_URL}`
}

export default function MisGruposView({ userId, initialGroups }: Props) {
  const [groups, setGroups] = useState<Group[]>(initialGroups)
  const [modal, setModal] = useState<null | 'create' | 'share' | 'join'>(null)
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [viewingGroup, setViewingGroup] = useState<Group | null>(null)
  const [members, setMembers] = useState<GroupMember[]>([])
  const [membersLoading, setMembersLoading] = useState(false)
  const [createName, setCreateName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [createdCode, setCreatedCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({})

  const copyCode = useCallback((code: string) => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }, [])

  const handleCreate = useCallback(async () => {
    if (!createName.trim()) return
    setLoading(true)
    setError(null)
    try {
      const result = await createGroup(createName.trim())
      if (result.error || !result.data) throw new Error(result.error ?? 'Error al crear grupo')
      setGroups(prev => [...prev, result.data!])
      setCreatedCode(result.data!.code)
      setSelectedGroup(result.data!)
      setCreateName('')
      setModal('share')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al crear grupo')
    } finally {
      setLoading(false)
    }
  }, [createName])

  const handleJoin = useCallback(async () => {
    if (!joinCode.trim()) return
    setLoading(true)
    setError(null)
    try {
      const result = await joinGroup(joinCode.trim())
      if (result.error || !result.data) throw new Error(result.error ?? 'Error al unirse')
      setGroups(prev => [...prev, result.data!])
      setJoinCode('')
      setModal(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al unirse')
    } finally {
      setLoading(false)
    }
  }, [joinCode])

  const openDetail = useCallback(async (group: Group) => {
    setViewingGroup(group)
    setMembersLoading(true)
    try {
      const result = await getGroupMembers(group.id)
      const rows: GroupMember[] = (result.data ?? []).map(r => ({
        user_id: r.user_id,
        username: r.profiles?.username ?? null,
        avatar_url: r.profiles?.avatar_url ?? null,
        total_points: r.profiles?.total_points ?? 0,
      })).sort((a, b) => b.total_points - a.total_points)
      setMembers(rows)
      setMemberCounts(prev => ({ ...prev, [group.id]: rows.length }))
    } finally {
      setMembersLoading(false)
    }
  }, [])

  // ── Group detail ────────────────────────────────────────────────────────────
  if (viewingGroup) {
    return (
      <div>
        <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => setViewingGroup(null)}
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 10, padding: '6px 12px', cursor: 'pointer', color: 'rgba(255,255,255,0.60)', fontSize: 13, fontWeight: 600 }}
          >
            ← Mis Grupos
          </button>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: 0, fontFamily: 'var(--font-montserrat, system-ui)' }}>
              {viewingGroup.name}
            </h1>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: 0 }}>
              {membersLoading ? '...' : `${members.length} miembro${members.length !== 1 ? 's' : ''}`}
              {' · '}Código: <strong style={{ color: '#60a5fa', letterSpacing: '0.06em' }}>{viewingGroup.code}</strong>
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          <button
            onClick={() => copyCode(viewingGroup.code)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 10, background: copied ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.06)', border: `1px solid ${copied ? 'rgba(34,197,94,0.30)' : 'rgba(255,255,255,0.10)'}`, cursor: 'pointer', color: copied ? '#4ade80' : 'rgba(255,255,255,0.70)', fontSize: 13, fontWeight: 600 }}
          >
            {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
            {copied ? '¡Copiado!' : 'Copiar código'}
          </button>
          <button
            onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(shareText(viewingGroup.code, viewingGroup.name))}`, '_blank')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 10, background: 'rgba(37,211,102,0.10)', border: '1px solid rgba(37,211,102,0.25)', cursor: 'pointer', color: '#4ade80', fontSize: 13, fontWeight: 600 }}
          >
            <WhatsAppIcon />
            Invitar
          </button>
        </div>

        <div style={{ ...CARD, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={14} style={{ color: 'rgba(255,255,255,0.40)' }} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.40)', textTransform: 'uppercase' }}>
              Clasificación del grupo
            </span>
          </div>
          {membersLoading ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'rgba(255,255,255,0.30)', fontSize: 13 }}>
              Cargando...
            </div>
          ) : members.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'rgba(255,255,255,0.30)', fontSize: 13 }}>
              Sin miembros aún
            </div>
          ) : (
            members.map((m, i) => {
              const isMe = m.user_id === userId
              const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null
              return (
                <div
                  key={m.user_id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px',
                    borderBottom: i < members.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    background: isMe ? 'rgba(0,106,51,0.10)' : 'transparent',
                  }}
                >
                  <div style={{ width: 28, textAlign: 'center', flexShrink: 0 }}>
                    {medal
                      ? <span style={{ fontSize: 18 }}>{medal}</span>
                      : <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.30)' }}>#{i + 1}</span>
                    }
                  </div>
                  {m.avatar_url ? (
                    <img src={m.avatar_url} alt={m.username ?? ''} style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: isMe ? '2px solid rgba(0,106,51,0.60)' : '2px solid rgba(255,255,255,0.08)' }} />
                  ) : (
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: isMe ? '#006A33' : 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                      {(m.username ?? '?')[0]?.toUpperCase()}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: isMe ? 700 : 500, color: isMe ? '#fff' : 'rgba(255,255,255,0.80)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {m.username ?? 'Jugador'}
                      {isMe && <span style={{ marginLeft: 6, fontSize: 10, color: '#4ade80', fontWeight: 700 }}>TÚ</span>}
                    </p>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: isMe ? '#4ade80' : 'rgba(255,255,255,0.55)', flexShrink: 0 }}>
                    {m.total_points} pts
                  </span>
                </div>
              )
            })
          )}
        </div>
      </div>
    )
  }

  // ── Groups list ─────────────────────────────────────────────────────────────
  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#fff', margin: 0, marginBottom: 4, fontFamily: 'var(--font-montserrat, system-ui)', letterSpacing: '-0.01em' }}>
          Mis Grupos
        </h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.40)', margin: 0 }}>
          Competí con amigos en grupos privados
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 28 }}>
        <button
          onClick={() => { setModal('create'); setError(null); setCreateName('') }}
          style={{ ...CARD, padding: 20, cursor: 'pointer', textAlign: 'center', border: '1px solid rgba(0,106,51,0.35)', background: 'rgba(0,106,51,0.08)', transition: 'background 0.15s' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,106,51,0.15)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,106,51,0.08)')}
        >
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(0,106,51,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
            <Plus size={20} style={{ color: '#4ade80' }} />
          </div>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#fff' }}>Crear grupo</p>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.40)' }}>Invitá a tus amigos</p>
        </button>

        <button
          onClick={() => { setModal('join'); setError(null); setJoinCode('') }}
          style={{ ...CARD, padding: 20, cursor: 'pointer', textAlign: 'center', border: '1px solid rgba(96,165,250,0.25)', background: 'rgba(96,165,250,0.06)', transition: 'background 0.15s' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(96,165,250,0.12)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(96,165,250,0.06)')}
        >
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(96,165,250,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
            <Hash size={20} style={{ color: '#60a5fa' }} />
          </div>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#fff' }}>Unirse con código</p>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.40)' }}>Ingresá el código del grupo</p>
        </button>
      </div>

      {groups.length > 0 ? (
        <div style={{ ...CARD, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.40)', textTransform: 'uppercase' }}>
              Tus grupos
            </span>
          </div>
          {groups.map((g, i) => (
            <button
              key={g.id}
              onClick={() => openDetail(g)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px',
                width: '100%', cursor: 'pointer', textAlign: 'left',
                background: 'transparent',
                border: 'none',
                borderBottom: i < groups.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(0,106,51,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Users size={18} style={{ color: '#4ade80' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {g.name}
                </p>
                <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
                  Código: <strong style={{ color: '#60a5fa', letterSpacing: '0.06em' }}>{g.code}</strong>
                  {memberCounts[g.id] != null && (
                    <span> · {memberCounts[g.id]} miembro{memberCounts[g.id] !== 1 ? 's' : ''}</span>
                  )}
                </p>
              </div>
              <ChevronRight size={16} style={{ color: 'rgba(255,255,255,0.25)', flexShrink: 0 }} />
            </button>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '56px 24px', color: 'rgba(255,255,255,0.25)' }}>
          <Users size={44} style={{ margin: '0 auto 14px', opacity: 0.3, display: 'block' }} />
          <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.30)' }}>Todavía no tenés grupos</p>
          <p style={{ margin: '6px 0 0', fontSize: 13 }}>Creá uno o uníte con un código</p>
        </div>
      )}

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      {modal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) setModal(null) }}
        >
          <div style={{ background: '#0E1A2B', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 20, padding: 28, width: '100%', maxWidth: 400, position: 'relative' }}>
            <button
              onClick={() => setModal(null)}
              style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '6px 8px', cursor: 'pointer', color: 'rgba(255,255,255,0.50)', display: 'flex', alignItems: 'center' }}
            >
              <X size={16} />
            </button>

            {modal === 'create' && (
              <>
                <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 700, color: '#fff' }}>Crear grupo</h2>
                <p style={{ margin: '0 0 20px', fontSize: 13, color: 'rgba(255,255,255,0.40)' }}>Dale un nombre a tu grupo privado</p>
                <input
                  type="text"
                  placeholder="Ej: Los Cracks de la Ofi"
                  value={createName}
                  onChange={e => setCreateName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleCreate() }}
                  maxLength={40}
                  autoFocus
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box', marginBottom: error ? 8 : 20 }}
                />
                {error && <p style={{ margin: '0 0 16px', fontSize: 13, color: '#f87171' }}>{error}</p>}
                <button
                  onClick={handleCreate}
                  disabled={!createName.trim() || loading}
                  style={{ width: '100%', padding: '13px', borderRadius: 12, background: createName.trim() && !loading ? '#006A33' : 'rgba(255,255,255,0.06)', border: 'none', cursor: createName.trim() && !loading ? 'pointer' : 'not-allowed', color: '#fff', fontSize: 14, fontWeight: 700, transition: 'background 0.15s' }}
                >
                  {loading ? 'Creando...' : 'Crear grupo'}
                </button>
              </>
            )}

            {modal === 'share' && (
              <>
                <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 700, color: '#fff' }}>¡Grupo creado!</h2>
                <p style={{ margin: '0 0 24px', fontSize: 13, color: 'rgba(255,255,255,0.40)' }}>Compartí este código con tus amigos</p>
                <div style={{ background: 'rgba(0,106,51,0.12)', border: '1px solid rgba(0,106,51,0.30)', borderRadius: 16, padding: '24px 20px', textAlign: 'center', marginBottom: 20 }}>
                  <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, letterSpacing: '0.10em', color: 'rgba(255,255,255,0.40)', textTransform: 'uppercase' }}>Código de grupo</p>
                  <p style={{ margin: 0, fontSize: 38, fontWeight: 900, color: '#4ade80', letterSpacing: '0.14em', fontFamily: 'monospace' }}>{createdCode}</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => copyCode(createdCode)}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '12px', borderRadius: 12, background: copied ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.06)', border: `1px solid ${copied ? 'rgba(34,197,94,0.30)' : 'rgba(255,255,255,0.10)'}`, cursor: 'pointer', color: copied ? '#4ade80' : '#fff', fontSize: 14, fontWeight: 600, transition: 'all 0.15s' }}
                  >
                    {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
                    {copied ? '¡Copiado!' : 'Copiar'}
                  </button>
                  <button
                    onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(shareText(createdCode, selectedGroup?.name ?? ''))}`, '_blank')}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '12px', borderRadius: 12, background: 'rgba(37,211,102,0.10)', border: '1px solid rgba(37,211,102,0.25)', cursor: 'pointer', color: '#4ade80', fontSize: 14, fontWeight: 600 }}
                  >
                    <WhatsAppIcon />
                    WhatsApp
                  </button>
                </div>
              </>
            )}

            {modal === 'join' && (
              <>
                <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 700, color: '#fff' }}>Unirse a un grupo</h2>
                <p style={{ margin: '0 0 20px', fontSize: 13, color: 'rgba(255,255,255,0.40)' }}>Ingresá el código que te compartieron</p>
                <input
                  type="text"
                  placeholder="Ej: AMIG7KX"
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value.toUpperCase())}
                  onKeyDown={e => { if (e.key === 'Enter') handleJoin() }}
                  maxLength={10}
                  autoFocus
                  style={{ width: '100%', padding: '13px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: 20, fontWeight: 700, letterSpacing: '0.16em', outline: 'none', boxSizing: 'border-box', marginBottom: error ? 8 : 20, fontFamily: 'monospace', textTransform: 'uppercase', textAlign: 'center' }}
                />
                {error && <p style={{ margin: '0 0 16px', fontSize: 13, color: '#f87171' }}>{error}</p>}
                <button
                  onClick={handleJoin}
                  disabled={!joinCode.trim() || loading}
                  style={{ width: '100%', padding: '13px', borderRadius: 12, background: joinCode.trim() && !loading ? '#0052A5' : 'rgba(255,255,255,0.06)', border: 'none', cursor: joinCode.trim() && !loading ? 'pointer' : 'not-allowed', color: '#fff', fontSize: 14, fontWeight: 700, transition: 'background 0.15s' }}
                >
                  {loading ? 'Uniéndose...' : 'Unirse al grupo'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
