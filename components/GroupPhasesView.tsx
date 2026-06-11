'use client'

import { useState, useEffect, useCallback } from 'react'
import { X } from 'lucide-react'
import {
  getGroupPhases, setupGroupPhases, markPhasePaid, markPhaseUnpaid, setPhaseWinner,
  type GroupPhase,
} from '@/app/actions/groups'
import type { Group } from './MisGruposView'

const PHASE_LABELS: Record<string, string> = {
  grupos:  'Fase de Grupos',
  octavos: 'Octavos de Final',
  cuartos: 'Cuartos de Final',
  semis:   'Semifinales',
  final:   'Final',
}

const PHASE_ORDER = ['grupos', 'octavos', 'cuartos', 'semis', 'final']
const GOLD  = '#F6B73C'
const GREEN = '#006A33'

export interface GroupMember {
  user_id: string
  username: string | null
  avatar_url: string | null
  total_points: number
}

// ── Setup modal ────────────────────────────────────────────────────────────────

interface PhaseConfig { phase: string; entry_fee: number; currency: string; enabled: boolean }

function SetupPhasesModal({
  group,
  existingPhases,
  onSave,
  onClose,
}: {
  group: Group
  existingPhases: GroupPhase[]
  onSave: (phases: { phase: string; entry_fee: number; currency: string }[]) => Promise<void>
  onClose: () => void
}) {
  const [config, setConfig] = useState<PhaseConfig[]>(
    PHASE_ORDER.map(phase => ({
      phase,
      entry_fee: existingPhases.find(p => p.phase === phase)?.entry_fee ?? 0,
      currency: group.currency ?? 'Gs',
      enabled: existingPhases.length === 0
        ? true
        : existingPhases.some(p => p.phase === phase),
    }))
  )
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    const enabled = config.filter(c => c.enabled)
    if (!enabled.length) return
    setSaving(true)
    await onSave(enabled)
    setSaving(false)
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: '#0E1A2B', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 20, padding: 24, width: '100%', maxWidth: 400, maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '6px 8px', cursor: 'pointer', color: 'rgba(255,255,255,0.50)', display: 'flex', alignItems: 'center' }}>
          <X size={15} />
        </button>

        <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700, color: '#fff' }}>Apuestas por fase</h3>
        <p style={{ margin: '0 0 20px', fontSize: 13, color: 'rgba(255,255,255,0.40)' }}>Activá las fases y poné el aporte de cada una</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {config.map((item, i) => (
            <div key={item.phase} style={{ border: `1px solid ${item.enabled ? 'rgba(0,106,51,0.50)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 14, padding: '12px 14px', background: item.enabled ? 'rgba(0,106,51,0.08)' : 'rgba(255,255,255,0.03)', transition: 'all 0.15s' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: item.enabled ? 10 : 0 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: item.enabled ? '#fff' : 'rgba(255,255,255,0.40)' }}>
                  {PHASE_LABELS[item.phase]}
                </span>
                <button
                  onClick={() => setConfig(prev => prev.map((p, idx) => idx === i ? { ...p, enabled: !p.enabled } : p))}
                  style={{ width: 20, height: 20, borderRadius: 6, border: `1.5px solid ${item.enabled ? GREEN : 'rgba(255,255,255,0.25)'}`, background: item.enabled ? GREEN : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                >
                  {item.enabled && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </button>
              </div>

              {item.enabled && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={item.entry_fee ? Number(item.entry_fee).toLocaleString('es-PY') : ''}
                    onChange={e => {
                      const raw = e.target.value.replace(/\D/g, '')
                      setConfig(prev => prev.map((p, idx) => idx === i ? { ...p, entry_fee: raw ? Number(raw) : 0 } : p))
                    }}
                    placeholder="Aporte (ej: 50.000)"
                    style={{ flex: 1, padding: '9px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: 13, outline: 'none' }}
                  />
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.40)', flexShrink: 0 }}>{item.currency}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '12px', borderRadius: 12, background: 'transparent', border: '1px solid rgba(255,255,255,0.10)', cursor: 'pointer', color: 'rgba(255,255,255,0.60)', fontSize: 14, fontWeight: 600 }}>
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || config.filter(c => c.enabled).length === 0}
            style={{ flex: 1, padding: '12px', borderRadius: 12, background: saving ? 'rgba(0,106,51,0.50)' : GREEN, border: 'none', cursor: saving ? 'not-allowed' : 'pointer', color: '#fff', fontSize: 14, fontWeight: 700, transition: 'background 0.15s' }}
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export function GroupPhasesView({
  group,
  members,
  userId,
  isCreator,
}: {
  group: Group
  members: GroupMember[]
  userId: string
  isCreator: boolean
}) {
  const [phases, setPhases] = useState<GroupPhase[]>([])
  const [loading, setLoading] = useState(true)
  const [showSetup, setShowSetup] = useState(false)
  const [winnerSelect, setWinnerSelect] = useState<Record<string, string>>({})
  const [actionLoading, setActionLoading] = useState<string | null>(null) // tracks phaseId + userId
  const [confirmWinner, setConfirmWinner] = useState<{ phaseId: string; winnerId: string; winnerName: string } | null>(null)

  const loadPhases = useCallback(async () => {
    const result = await getGroupPhases(group.id)
    if (result.data) setPhases(result.data)
    setLoading(false)
  }, [group.id])

  useEffect(() => { loadPhases() }, [loadPhases])

  const handleMarkPaid = async (phaseId: string, memberId: string) => {
    const key = `${phaseId}:${memberId}`
    setActionLoading(key)
    const result = await markPhasePaid({ phaseId, userId: memberId })
    if (result.error) { setActionLoading(null); return }
    setPhases(prev => prev.map(p =>
      p.id === phaseId
        ? { ...p, payments: [...(p.payments ?? []), { user_id: memberId }] }
        : p
    ))
    setActionLoading(null)
  }

  const handleMarkUnpaid = async (phaseId: string, memberId: string) => {
    const key = `${phaseId}:${memberId}:unpaid`
    setActionLoading(key)
    await markPhaseUnpaid({ phaseId, userId: memberId })
    setPhases(prev => prev.map(p =>
      p.id === phaseId
        ? { ...p, payments: (p.payments ?? []).filter(pay => pay.user_id !== memberId) }
        : p
    ))
    setActionLoading(null)
  }

  const handleSetWinner = async () => {
    if (!confirmWinner) return
    setActionLoading(`winner:${confirmWinner.phaseId}`)
    const result = await setPhaseWinner({ phaseId: confirmWinner.phaseId, winnerId: confirmWinner.winnerId })
    setConfirmWinner(null)
    if (result.data) {
      setPhases(prev => prev.map(p =>
        p.id === confirmWinner.phaseId
          ? { ...p, winner_id: confirmWinner.winnerId, status: 'closed' }
          : p
      ))
    }
    setActionLoading(null)
  }

  if (loading) {
    return <div style={{ padding: '40px 0', textAlign: 'center', color: 'rgba(255,255,255,0.30)', fontSize: 13 }}>Cargando...</div>
  }

  if (phases.length === 0) {
    return (
      <div>
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(246,183,60,0.08)', border: '1px solid rgba(246,183,60,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.8">
              <circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>
            </svg>
          </div>
          <p style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.50)' }}>Sin apuestas por fase</p>
          <p style={{ margin: '0 0 20px', fontSize: 13, color: 'rgba(255,255,255,0.30)' }}>Configurá los aportes para cada fase del torneo</p>
          {isCreator && (
            <button
              onClick={() => setShowSetup(true)}
              style={{ padding: '11px 22px', borderRadius: 12, background: GREEN, border: 'none', cursor: 'pointer', color: '#fff', fontSize: 14, fontWeight: 700 }}
            >
              Configurar fases
            </button>
          )}
        </div>
        {showSetup && (
          <SetupPhasesModal
            group={group}
            existingPhases={phases}
            onSave={async newPhases => {
              const result = await setupGroupPhases({ groupId: group.id, phases: newPhases })
              if (!result.error) { await loadPhases(); setShowSetup(false) }
            }}
            onClose={() => setShowSetup(false)}
          />
        )}
      </div>
    )
  }

  const totalEstimated = phases.reduce((acc, p) => acc + Number(p.entry_fee) * members.length, 0)
  const currency = phases[0]?.currency ?? 'Gs'

  return (
    <div>
      {phases.map(phase => {
        const paidCount  = phase.payments?.length ?? 0
        const progress   = members.length > 0 ? (paidCount / members.length) * 100 : 0
        const pot        = Number(phase.entry_fee) * paidCount
        const winner     = phase.winner_id ? members.find(m => m.user_id === phase.winner_id) : null
        const statusColor =
          phase.status === 'active'  ? '#00C46A' :
          phase.status === 'closed'  ? '#CE1126' :
                                       'rgba(255,255,255,0.35)'
        const statusBg =
          phase.status === 'active'  ? 'rgba(0,196,106,0.12)' :
          phase.status === 'closed'  ? 'rgba(206,17,38,0.10)' :
                                       'rgba(255,255,255,0.06)'
        const statusLabel =
          phase.status === 'active'  ? 'En curso' :
          phase.status === 'closed'  ? 'Cerrada'  : 'Próximamente'

        return (
          <div key={phase.id} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18, padding: '14px 16px', marginBottom: 12 }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{PHASE_LABELS[phase.phase]}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: statusColor, background: statusBg, border: `1px solid ${statusColor}30`, padding: '3px 9px', borderRadius: 20 }}>
                {statusLabel}
              </span>
            </div>

            {/* Pot row */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 10 }}>
              <div>
                <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: GOLD, letterSpacing: '-0.01em' }}>
                  {phase.currency} {pot.toLocaleString('es-PY')}
                </p>
                <p style={{ margin: '2px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
                  {paidCount} de {members.length} pagaron · {phase.currency} {Number(phase.entry_fee).toLocaleString('es-PY')} c/u
                </p>
              </div>
              {winner && (
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#00C46A' }}>🥇 {winner.username}</p>
                  <p style={{ margin: '1px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.30)' }}>Ganador</p>
                </div>
              )}
            </div>

            {/* Progress bar */}
            <div style={{ height: 5, background: 'rgba(255,255,255,0.07)', borderRadius: 99, overflow: 'hidden', marginBottom: 12 }}>
              <div style={{ height: '100%', background: GREEN, borderRadius: 99, width: `${progress}%`, transition: 'width 0.4s' }} />
            </div>

            {/* Member chips */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {members.map(member => {
                const paid     = phase.payments?.some(p => p.user_id === member.user_id) ?? false
                const isMe     = member.user_id === userId
                const canAct   = (isCreator || isMe) && phase.status !== 'closed'
                const busy     = actionLoading === `${phase.id}:${member.user_id}` || actionLoading === `${phase.id}:${member.user_id}:unpaid`
                const myUnpaid = isMe && !paid && !isCreator

                return (
                  <button
                    key={member.user_id}
                    disabled={!canAct || busy}
                    onClick={() => canAct && (paid ? handleMarkUnpaid(phase.id, member.user_id) : handleMarkPaid(phase.id, member.user_id))}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: myUnpaid ? '7px 12px' : '5px 9px',
                      borderRadius: 10, fontSize: myUnpaid ? 13 : 12,
                      fontWeight: myUnpaid ? 700 : 600,
                      cursor: canAct ? 'pointer' : 'default',
                      border: 'none',
                      background: paid
                        ? 'rgba(0,106,51,0.20)'
                        : myUnpaid
                          ? 'rgba(0,106,51,0.15)'
                          : 'rgba(255,255,255,0.05)',
                      color: paid ? '#4ade80' : myUnpaid ? '#4ade80' : 'rgba(255,255,255,0.40)',
                      outline: paid
                        ? '1px solid rgba(0,106,51,0.35)'
                        : myUnpaid
                          ? '1.5px solid rgba(0,106,51,0.55)'
                          : '1px solid rgba(255,255,255,0.08)',
                      opacity: busy ? 0.5 : 1,
                      transition: 'all 0.15s',
                    }}
                  >
                    {member.avatar_url
                      ? <img src={member.avatar_url} alt="" style={{ width: 16, height: 16, borderRadius: '50%', objectFit: 'cover' }} />
                      : <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#fff' }}>{(member.username ?? '?')[0]?.toUpperCase()}</div>
                    }
                    {myUnpaid
                      ? <>Apostar {busy ? '...' : '→'}</>
                      : <>{(member.username ?? 'Jugador').split(' ')[0]}{paid && <span style={{ fontSize: 10 }}>✓</span>}</>
                    }
                  </button>
                )
              })}
            </div>

            {/* Declare winner — creator only, active phase */}
            {isCreator && phase.status === 'active' && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', flexShrink: 0 }}>Declarar ganador:</span>
                <select
                  value={winnerSelect[phase.id] ?? ''}
                  onChange={e => setWinnerSelect(prev => ({ ...prev, [phase.id]: e.target.value }))}
                  style={{ flex: 1, padding: '7px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', color: winnerSelect[phase.id] ? '#fff' : 'rgba(255,255,255,0.35)', fontSize: 12, outline: 'none', cursor: 'pointer' }}
                >
                  <option value="" disabled>Elegir ganador...</option>
                  {members.map(m => (
                    <option key={m.user_id} value={m.user_id}>{m.username ?? 'Jugador'}</option>
                  ))}
                </select>
                <button
                  disabled={!winnerSelect[phase.id] || actionLoading === `winner:${phase.id}`}
                  onClick={() => {
                    const wId = winnerSelect[phase.id]
                    const wName = members.find(m => m.user_id === wId)?.username ?? 'este jugador'
                    if (wId) setConfirmWinner({ phaseId: phase.id, winnerId: wId, winnerName: wName })
                  }}
                  style={{ padding: '7px 13px', borderRadius: 10, background: winnerSelect[phase.id] ? GREEN : 'rgba(255,255,255,0.06)', border: 'none', cursor: winnerSelect[phase.id] ? 'pointer' : 'not-allowed', color: winnerSelect[phase.id] ? '#fff' : 'rgba(255,255,255,0.25)', fontSize: 12, fontWeight: 700, flexShrink: 0, transition: 'background 0.15s' }}
                >
                  Confirmar
                </button>
              </div>
            )}
          </div>
        )
      })}

      {/* Total estimated pot */}
      <div style={{ background: 'rgba(246,183,60,0.06)', border: '1px solid rgba(246,183,60,0.15)', borderRadius: 16, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>Pozo total estimado</p>
          <p style={{ margin: '3px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>Si todos participan en todas las fases</p>
        </div>
        <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: GOLD }}>{currency} {totalEstimated.toLocaleString('es-PY')}</p>
      </div>

      {/* Edit phases — creator only */}
      {isCreator && (
        <button
          onClick={() => setShowSetup(true)}
          style={{ width: '100%', padding: '11px', borderRadius: 12, background: 'transparent', border: '1px solid rgba(255,255,255,0.09)', cursor: 'pointer', color: 'rgba(255,255,255,0.40)', fontSize: 13, fontWeight: 600 }}
        >
          Editar configuración de fases
        </button>
      )}

      {/* Setup modal */}
      {showSetup && (
        <SetupPhasesModal
          group={group}
          existingPhases={phases}
          onSave={async newPhases => {
            const result = await setupGroupPhases({ groupId: group.id, phases: newPhases })
            if (!result.error) { await loadPhases(); setShowSetup(false) }
          }}
          onClose={() => setShowSetup(false)}
        />
      )}

      {/* Confirm winner modal */}
      {confirmWinner && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
          onClick={e => { if (e.target === e.currentTarget) setConfirmWinner(null) }}
        >
          <div style={{ background: '#0E1A2B', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 20, padding: 28, width: '100%', maxWidth: 360, textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(246,183,60,0.10)', border: '1px solid rgba(246,183,60,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', fontSize: 26 }}>
              🥇
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: '#fff' }}>
              ¿Declarar ganador?
            </h3>
            <p style={{ margin: '0 0 24px', fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>
              <strong style={{ color: '#fff' }}>{confirmWinner.winnerName}</strong> ganará la fase <strong style={{ color: '#fff' }}>{PHASE_LABELS[phases.find(p => p.id === confirmWinner.phaseId)?.phase ?? ''] ?? ''}</strong> y esta quedará cerrada.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setConfirmWinner(null)}
                style={{ flex: 1, padding: '12px', borderRadius: 12, background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer', color: 'rgba(255,255,255,0.60)', fontSize: 14, fontWeight: 600 }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSetWinner}
                disabled={actionLoading?.startsWith('winner:')}
                style={{ flex: 1, padding: '12px', borderRadius: 12, background: GOLD, border: 'none', cursor: 'pointer', color: '#000', fontSize: 14, fontWeight: 700 }}
              >
                {actionLoading?.startsWith('winner:') ? 'Guardando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
