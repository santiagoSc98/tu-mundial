'use client'

type RankEntry   = { id: string; username: string | null; avatar_url: string | null; total_points: number }
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
                    <span style={{ fontSize: 13, fontWeight: 600, color: isMe ? '#22c55e' : '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {name}{isMe && ' (tú)'}
                    </span>
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
              <div style={{ padding: '8px 16px', background: 'rgba(0,106,51,0.15)', borderRadius: 10, border: '1px solid rgba(0,106,51,0.30)', display: 'inline-block' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#22c55e' }}>
                  Tu posición: #{myRank}
                </span>
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
