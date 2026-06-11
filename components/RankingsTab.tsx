'use client'

import { useState } from 'react'
import { Copy } from 'lucide-react'

const WA_APP_URL = 'https://tu-mundial.vercel.app/'

function WhatsAppIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
    </svg>
  )
}

type RankEntry   = { id: string; username: string | null; avatar_url: string | null; total_points: number; current_streak?: number }
type MyStats     = { total: number; correct: number }
type GlobalStats = { totalUsers: number; totalPredictions: number; avgAccuracy: number }

const MEDAL = ['#F6B73C', '#C0C0C0', '#CD7F32'] as const

// ─── Circular SVG progress ────────────────────────────────────────────────────
function CircleProgress({ pct }: { pct: number }) {
  const r    = 50
  const circ = 2 * Math.PI * r
  const off  = circ - (pct / 100) * circ
  return (
    <svg width={128} height={128} viewBox="0 0 128 128">
      <circle cx={64} cy={64} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={10} />
      <circle
        cx={64} cy={64} r={r} fill="none"
        stroke="#22c55e" strokeWidth={10} strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={off}
        transform="rotate(-90 64 64)"
        style={{ transition: 'stroke-dashoffset 0.8s ease' }}
      />
      <text x="50%" y="46%" textAnchor="middle" dominantBaseline="middle"
        fill="#fff" fontWeight="800" fontSize="22" fontFamily="Montserrat, system-ui">
        {pct}%
      </text>
      <text x="50%" y="63%" textAnchor="middle" dominantBaseline="middle"
        fill="rgba(255,255,255,0.45)" fontSize="10" fontFamily="system-ui">
        Aciertos
      </text>
    </svg>
  )
}

// ─── Avatar circle ────────────────────────────────────────────────────────────
function Avatar({ entry, size, border }: { entry: RankEntry | undefined; size: number; border: string }) {
  if (!entry) {
    return (
      <div style={{ width: size, height: size, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', border: '3px dashed rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: size * 0.3, color: 'rgba(255,255,255,0.20)' }}>?</span>
      </div>
    )
  }
  const name = entry.username ?? 'A'
  if (entry.avatar_url) {
    return <img src={entry.avatar_url} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border, flexShrink: 0 }} />
  }
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: '#1e293b', border, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.35, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
      {name[0]?.toUpperCase()}
    </div>
  )
}

// ─── Podium slot ──────────────────────────────────────────────────────────────
function PodiumSlot({ entry, pos, isMe }: { entry: RankEntry | undefined; pos: 1 | 2 | 3; isMe: boolean }) {
  const isFirst  = pos === 1
  const color    = isMe ? '#22c55e' : MEDAL[pos - 1]
  const avSize   = isFirst ? 96 : 72
  const numSize  = isFirst ? 36 : 28

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: isFirst ? 110 : 88 }}>
      {/* Medal number */}
      <div style={{ width: numSize, height: numSize, borderRadius: '50%', background: `${color}1A`, border: `2px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isFirst ? 15 : 12, fontWeight: 900, color }}>
        {pos}
      </div>

      {/* Avatar */}
      <Avatar
        entry={entry}
        size={avSize}
        border={`3px solid ${color}`}
      />

      {/* Name */}
      <p style={{ fontSize: isFirst ? 13 : 11, fontWeight: 700, color: isMe ? '#22c55e' : '#fff', textAlign: 'center', maxWidth: isFirst ? 100 : 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
        {entry ? (isMe ? 'Tú' : (entry.username ?? 'Anónimo')) : '—'}
      </p>

      {/* Points */}
      <p style={{ fontSize: isFirst ? 14 : 12, fontWeight: 800, color, margin: 0 }}>
        {entry ? `${entry.total_points.toLocaleString()} pts` : '—'}
      </p>
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton() {
  const pulse: React.CSSProperties = { background: 'rgba(255,255,255,0.08)', borderRadius: 6 }
  return (
    <div className="animate-pulse space-y-5">
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 20, padding: '20px 0' }}>
        {[64, 80, 64].map((s, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{ ...pulse, width: s * 0.4, height: s * 0.4, borderRadius: '50%' }} />
            <div style={{ ...pulse, width: s, height: s, borderRadius: '50%' }} />
            <div style={{ ...pulse, width: 60, height: 10 }} />
            <div style={{ ...pulse, width: 40, height: 9 }} />
          </div>
        ))}
      </div>
      {[0, 1, 2, 3, 4].map(i => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}>
          <div style={{ ...pulse, width: 28, height: 28, borderRadius: '50%' }} />
          <div style={{ ...pulse, width: 36, height: 36, borderRadius: '50%' }} />
          <div style={{ ...pulse, flex: 1, height: 12 }} />
          <div style={{ ...pulse, width: 60, height: 12 }} />
        </div>
      ))}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function RankingsTab({
  currentUserId, rankings, myStats, predCounts, globalStats,
}: {
  currentUserId: string | null
  rankings: RankEntry[]
  myStats: MyStats
  predCounts: Record<string, number>
  globalStats: GlobalStats
}) {
  const myRank    = rankings.findIndex((r: RankEntry) => r.id === currentUserId) + 1
  const accuracy  = myStats && myStats.total > 0 ? Math.round((myStats.correct / myStats.total) * 100) : 0
  const [p1, p2, p3] = rankings
  const [copied, setCopied] = useState(false)

  const CARD: React.CSSProperties = {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 24,
  }
  const SECTION_LABEL: React.CSSProperties = {
    fontSize: 10, fontWeight: 800, letterSpacing: '0.08em',
    color: 'rgba(255,255,255,0.35)', margin: 0, marginBottom: 16,
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-montserrat, system-ui)', margin: 0, marginBottom: 4, letterSpacing: '-0.01em' }}>
          Rankings
        </h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.40)', margin: 0 }}>
          Los mejores predictores
        </p>
      </div>

      {/* ── 2-column grid ───────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:grid gap-6" style={{ gridTemplateColumns: '3fr 2fr', alignItems: 'stretch' }}>

        {/* ══ COLUMNA IZQUIERDA ══════════════════════════════════════════════ */}
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

          {/* PODIO */}
          <div style={{ ...CARD, padding: 24, display: 'flex', flexDirection: 'column'}}>
            <p style={SECTION_LABEL}>PODIO</p>

            {rankings.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.30)', margin: 0 }}>
                  Invitá amigos para competir 🎯
                </p>
              </div>
            ) : (
              /* Orden visual: 2° | 1° (elevado) | 3° */
              <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 24 }}>
                  <PodiumSlot entry={p2} pos={2} isMe={p2?.id === currentUserId} />
                  <div style={{ marginBottom: 28 }}>
                    <PodiumSlot entry={p1} pos={1} isMe={p1?.id === currentUserId} />
                  </div>
                  <PodiumSlot entry={p3} pos={3} isMe={p3?.id === currentUserId} />
                </div>
              </div>
            )}

            {(rankings.length === 1 || (rankings.length >= 1 && rankings.length < 3)) && (
              <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 12 }}>
                Solo vos por ahora · Invitá amigos para competir 🎯
              </p>
            )}
          </div>

          {/* ── INVITAR AMIGOS ──────────────────────────────────────────────── */}
          <div style={{ ...CARD, marginTop: 16, padding: 20, textAlign: 'center' }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#fff', margin: '0 0 4px' }}>
              Invitá amigos a competir
            </p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', margin: '0 0 16px' }}>
              Compartí el link y que el mejor gane
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(WA_APP_URL)
                  setCopied(true)
                  setTimeout(() => setCopied(false), 2000)
                }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.10)', color: copied ? '#22c55e' : '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s' }}
              >
                <Copy size={15} />
                {copied ? '¡Copiado!' : 'Copiar link'}
              </button>
              <button
                onClick={() => {
                  const text = encodeURIComponent(`¡Unite a TU MUNDIAL y competí conmigo pronosticando el Mundial 2026! 🏆⚽\n${WA_APP_URL}`)
                  window.open(`https://wa.me/?text=${text}`, '_blank')
                }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 12, background: '#25D366', color: '#fff', border: 'none', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
              >
                <WhatsAppIcon /> WhatsApp
              </button>
            </div>
          </div>

            {/* ── TABLA COMPLETA ──────────────────────────────────────────────────── */}
      <div style={{ ...CARD, marginTop: 24, padding: 24 }}>
        <p style={SECTION_LABEL}>CLASIFICACIÓN COMPLETA</p>

        {/* Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '48px 1fr 100px 80px', gap: 8, padding: '0 12px', marginBottom: 6 }}>
          {['#', 'Usuario', 'Predicciones', 'Puntos'].map((h, i) => (
            <p key={h} style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)', margin: 0, textAlign: i > 1 ? 'right' : 'left' }}>
              {h}
            </p>
          ))}
        </div>

        {/* Filas */}
        {rankings.length === 0 ? (
          <p style={{ textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.30)', padding: '32px 0', margin: 0 }}>
            Solo vos por ahora · Invitá amigos para competir
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {rankings.map((entry, i) => {
              const isMe = entry.id === currentUserId
              const name = entry.username ?? 'Anónimo'
              const preds = predCounts[entry.id] ?? 0
              return (
                <div
                  key={entry.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '48px 1fr 100px 80px',
                    gap: 8,
                    padding: '10px 12px',
                    borderRadius: 14,
                    alignItems: 'center',
                    background: isMe ? 'rgba(0,106,51,0.18)' : 'transparent',
                    border: isMe ? '1px solid rgba(0,106,51,0.28)' : '1px solid transparent',
                  }}
                >
                  {/* Posición */}
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.35)', margin: 0 }}>
                    {i + 1}
                  </p>

                  {/* Avatar + nombre */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    {entry.avatar_url ? (
                      <img src={entry.avatar_url} alt={name} style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: isMe ? '#006A33' : '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                        {name[0]?.toUpperCase()}
                      </div>
                    )}
                    <div style={{ minWidth: 0 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: isMe ? '#22c55e' : '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                        {name}{isMe && ' (tú)'}
                      </span>
                      {(entry.current_streak ?? 0) > 0 && (
                        <span style={{ fontSize: 10, color: '#F6B73C', fontWeight: 600 }}>
                          🔥 {entry.current_streak}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Predicciones */}
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.40)', margin: 0, textAlign: 'right' }}>
                    {preds}
                  </p>

                  {/* Puntos */}
                  <p style={{ fontSize: 13, fontWeight: 800, color: '#fff', margin: 0, textAlign: 'right' }}>
                    {entry.total_points.toLocaleString()}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </div>
        </div>

        {/* ══ COLUMNA DERECHA ════════════════════════════════════════════════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'stretch' }}>

          {/* TU RENDIMIENTO */}
          <div style={{ ...CARD, padding: 24, textAlign: 'center' }}>
            <p style={SECTION_LABEL}>TU RENDIMIENTO</p>

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
              <CircleProgress pct={accuracy} />
            </div>

            <p style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: 0 }}>
              {myStats?.correct ?? 0} de {myStats?.total ?? 0}
            </p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.40)', marginTop: 2, marginBottom: 14 }}>
              Predicciones correctas
            </p>

            {myRank > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <div style={{ padding: '8px 16px', background: 'rgba(0,106,51,0.15)', borderRadius: 10, border: '1px solid rgba(0,106,51,0.30)', display: 'inline-block' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#22c55e' }}>
                    Tu posición: #{myRank}
                  </span>
                </div>
                <button
                  onClick={() => {
                    const myPoints = rankings.find(r => r.id === currentUserId)?.total_points ?? 0
                    const text = `Estoy #${myRank} en TU MUNDIAL con ${myPoints} pts. 🏆⚽\n¿Podés superarme? tu-mundial.vercel.app`
                    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px', borderRadius: 12, background: '#25D366', color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  <WhatsAppIcon /> Compartir mi posición
                </button>
              </div>
            )}

          </div>

          {/* ESTADÍSTICAS GENERALES */}
          <div style={{ ...CARD, padding: 24 }}>
            <p style={SECTION_LABEL}>ESTADÍSTICAS GENERALES</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { label: 'Usuarios totales',      value: globalStats?.totalUsers.toLocaleString()       ?? '—' },
                { label: 'Predicciones totales',  value: globalStats?.totalPredictions.toLocaleString() ?? '—' },
                { label: 'Promedio de aciertos',  value: globalStats ? `${globalStats.avgAccuracy}%`    : '—' },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.50)' }}>{label}</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      
    </div>
  )
}
