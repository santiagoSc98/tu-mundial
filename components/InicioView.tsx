'use client'

import { useMemo, useState, useCallback, useEffect } from 'react'
import {
  Calendar, Target, Trophy, CheckCircle, BarChart3, Zap,
  ChevronLeft, ChevronRight,
} from 'lucide-react'
import { getFlagUrl } from '@/lib/flagCodes'
import { pyISODate, pyTime, pyDateTimeMed, pyDateLabel, getTeamNameES } from '@/lib/worldcup'
import { CountdownTimer } from '@/components/CountdownTimer'
import type { Database } from '@/lib/database.types'

type Prediction = Database['public']['Tables']['predictions']['Row']

const STAGE_LABELS: Record<string, string> = {
  GROUP_STAGE: 'Grupos', ROUND_OF_16: 'Octavos', QUARTER_FINALS: 'Cuartos',
  SEMI_FINALS: 'Semis', THIRD_PLACE: '3er Puesto', FINAL: 'Final',
}

function parseStage(desc: string | null): string {
  return desc?.match(/Fase: ([A-Z_]+)/)?.[1] ?? ''
}

function getOptions(options: unknown): [string, string, string] {
  const opts = Array.isArray(options) ? (options as string[]) : []
  return [opts[0] ?? '', opts[1] ?? 'Empate', opts[2] ?? '']
}

function kickoff(p: Prediction): Date {
  const d = new Date((p.deadline ?? '') as string)
  if (isNaN(d.getTime())) return new Date(0)
  return new Date(d.getTime() + 10 * 60 * 1000)
}

function isMatchOpen(p: Prediction): boolean {
  return p.status === 'open' && new Date(p.deadline ?? 0) > new Date()
}

// ─── Glassmorphism card shell ─────────────────────────────────────────────────

const GLASS: React.CSSProperties = {
  background:           'rgba(255,255,255,0.05)',
  backdropFilter:       'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  border:               '1px solid rgba(255,255,255,0.08)',
  borderRadius:         24,
}

// ─── Percent bar ─────────────────────────────────────────────────────────────

function PercentBar({
  label, percent, selected, flag, barColor = '#22c55e',
}: {
  label: string; percent: number; selected?: boolean; flag?: string | null; barColor?: string
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {flag
        ? <img src={flag} alt={label} style={{ width: 16, height: 11, objectFit: 'cover', borderRadius: 2, flexShrink: 0 }} />
        : <span style={{ fontSize: 11, flexShrink: 0, lineHeight: 1 }}>⚖️</span>
      }
      <span style={{ fontSize: 12, width: 64, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: selected ? '#fff' : 'rgba(255,255,255,0.45)', fontWeight: selected ? 600 : 400 }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 10, borderRadius: 99, overflow: 'hidden', background: 'rgba(255,255,255,0.06)' }}>
        <div
          style={{
            width: `${percent}%`, height: '100%', borderRadius: 99,
            background: barColor, opacity: selected ? 1 : 0.35,
            transition: 'width 0.6s ease',
          }}
        />
      </div>
      <span style={{ fontSize: 12, width: 28, textAlign: 'right', flexShrink: 0, color: selected ? '#fff' : 'rgba(255,255,255,0.35)', fontWeight: selected ? 600 : 400 }}>
        {percent}%
      </span>
    </div>
  )
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function deduceResult(homeScore: number, awayScore: number, home: string, away: string, draw: string): string {
  if (homeScore > awayScore) return home
  if (awayScore > homeScore) return away
  return draw
}

const SCORE_BTN: React.CSSProperties = {
  width: 32, height: 32, borderRadius: 8,
  border: '1px solid rgba(255,255,255,0.15)',
  background: 'rgba(255,255,255,0.08)',
  color: '#fff', fontSize: 14, fontWeight: 700,
  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1,
  flexShrink: 0,
}

function ScorePicker({
  home, away, homeFlag, awayFlag,
  homeScore, awayScore, setHomeScore, setAwayScore,
}: {
  home: string; away: string
  homeFlag: string | null; awayFlag: string | null
  homeScore: number; awayScore: number
  setHomeScore: React.Dispatch<React.SetStateAction<number>>
  setAwayScore: React.Dispatch<React.SetStateAction<number>>
}) {
  return (
    <div className="flex items-start justify-center gap-12 my-4">

      {/* Home */}
      <div className="flex flex-col items-center gap-2">
        {homeFlag
          ? <img src={homeFlag} alt={home} className="w-24 h-16 rounded-2xl object-cover" />
          : <div className="w-24 h-16 rounded-2xl" style={{ background: 'rgba(255,255,255,0.10)' }} />
        }
        <p className="text-sm font-bold" style={{ color: '#fff', margin: 0 }}>{home}</p>
        <span className="text-5xl font-bold leading-none" style={{ fontFamily: 'var(--font-montserrat, system-ui)', color: '#fff' }}>
          {homeScore}
        </span>
        <div className="flex gap-2">
          <button style={SCORE_BTN} onClick={() => setHomeScore(s => Math.max(0, s - 1))}>−</button>
          <button style={SCORE_BTN} onClick={() => setHomeScore(s => Math.min(9, s + 1))}>+</button>
        </div>
      </div>

      {/* Separator */}
      <span className="text-4xl flex-shrink-0 mt-8" style={{ color: '#4b5563', fontWeight: 900, fontFamily: 'var(--font-montserrat, system-ui)' }}>:</span>

      {/* Away */}
      <div className="flex flex-col items-center gap-2">
        {awayFlag
          ? <img src={awayFlag} alt={away} className="w-24 h-16 rounded-2xl object-cover" />
          : <div className="w-24 h-16 rounded-2xl" style={{ background: 'rgba(255,255,255,0.10)' }} />
        }
        <p className="text-sm font-bold" style={{ color: '#fff', margin: 0 }}>{away}</p>
        <span className="text-5xl font-bold leading-none" style={{ fontFamily: 'var(--font-montserrat, system-ui)', color: '#fff' }}>
          {awayScore}
        </span>
        <div className="flex gap-2">
          <button style={SCORE_BTN} onClick={() => setAwayScore(s => Math.max(0, s - 1))}>−</button>
          <button style={SCORE_BTN} onClick={() => setAwayScore(s => Math.min(9, s + 1))}>+</button>
        </div>
      </div>

    </div>
  )
}

// ─── Predict panel (match list rows) ─────────────────────────────────────────

function PredictPanel({
  prediction, existingAnswer, voteData, loading, submitting, onPredict, localScore, initialEditMode,
}: {
  prediction: Prediction
  existingAnswer: string | null
  voteData: Record<string, number>
  loading: boolean
  submitting: boolean
  onPredict: (answer: string, homeScore: number, awayScore: number) => void
  localScore?: { home: number; away: number }
  initialEditMode?: boolean
}) {
  const [homeRaw, draw, awayRaw] = getOptions(prediction.options)
  const home     = getTeamNameES(homeRaw)
  const away     = getTeamNameES(awayRaw)
  const homeFlag = getFlagUrl(prediction.home_team_code)
  const awayFlag = getFlagUrl(prediction.away_team_code)
  const open     = isMatchOpen(prediction)
  const answered = !!existingAnswer
  const canEdit  = answered && open
  const isFootball = !!(prediction.home_team_code && prediction.away_team_code)

  const [showPredict, setShowPredict] = useState(() => !!(initialEditMode || (!answered && open && isFootball)))
  const [homeScore,   setHomeScore]   = useState(localScore?.home ?? 0)
  const [awayScore,   setAwayScore]   = useState(localScore?.away ?? 0)


  const total = Object.values(voteData).reduce((a, b) => a + b, 0)
  const pct   = (key: string) => total > 0 ? Math.round((voteData[key] ?? 0) / total * 100) : 0

  const outer: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 20, marginTop: 8, padding: 20,
  }

  // ── State 2: score picker ──────────────────────────────────────────────────
  if (showPredict && open && isFootball) {
    const deduced = deduceResult(homeScore, awayScore, home, away, draw)
    return (
      <div className="animate-fade-in" style={outer}>
        <button
          onClick={() => setShowPredict(false)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'rgba(255,255,255,0.50)', cursor: 'pointer', fontSize: 13, fontWeight: 600, marginBottom: 20, padding: 0 }}
          onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.50)')}
        >
          ← Volver
        </button>
        <p style={{ textAlign: 'center', fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 8, letterSpacing: '0.1em', fontWeight: 700 }}>
          {canEdit ? 'CAMBIAR PREDICCIÓN' : '¿CUÁL SERÁ EL MARCADOR?'}
        </p>
        <ScorePicker home={home} away={away} homeFlag={homeFlag} awayFlag={awayFlag}
          homeScore={homeScore} awayScore={awayScore} setHomeScore={setHomeScore} setAwayScore={setAwayScore} />
        <p className="text-center text-sm mb-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
          Ganará: <strong style={{ color: homeScore > awayScore ? '#00C46A' : awayScore > homeScore ? '#4d9fff' : '#6E7A99' }}>{deduced}</strong>
        </p>
        <p className="text-center text-xs mb-4">
          <span style={{ color: '#00C46A' }}>+3 pts resultado</span>
          <span style={{ color: 'rgba(255,255,255,0.25)', margin: '0 5px' }}>·</span>
          <span style={{ color: '#F6B73C' }}>+8 pts exacto</span>
        </p>
        <button
          onClick={() => { if (!submitting) { onPredict(deduced, homeScore, awayScore); setShowPredict(false) } }}
          className="w-full text-white font-semibold text-base rounded-2xl transition-colors"
          style={{ padding: '14px 0', background: '#006A33', border: 'none', cursor: submitting ? 'default' : 'pointer', opacity: submitting ? 0.6 : 1 }}
          onMouseEnter={e => { if (!submitting) (e.currentTarget as HTMLButtonElement).style.background = '#005828' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#006A33' }}
        >
          {canEdit ? 'Guardar cambio' : 'Confirmar predicción'}
        </button>
      </div>
    )
  }

  // ── State 1: vote bars + CTA ───────────────────────────────────────────────
  return (
    <div className="animate-fade-in" style={outer}>
      {!open && !answered && (
        <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 14, letterSpacing: '0.06em' }}>
          Predicciones cerradas
        </p>
      )}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0' }}>
          <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.10)', borderTopColor: '#006A33', animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
          <PercentBar label={home} percent={pct(home)} selected={existingAnswer === home} flag={homeFlag} barColor="#006A33" />
          <PercentBar label={draw} percent={pct(draw)} selected={existingAnswer === draw} barColor="#6E7A99" />
          <PercentBar label={away} percent={pct(away)} selected={existingAnswer === away} flag={awayFlag} barColor="#0052A5" />
        </div>
      )}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: open && !answered && isFootball ? 14 : 0 }}>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.30)' }}>👥 {total} predicciones</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#22c55e' }}>
          🏆 +3 pts{isFootball && <span style={{ color: '#F6B73C' }}> · +8 exacto</span>}
        </span>
      </div>
      {open && !answered && isFootball && (
        <button
          onClick={() => setShowPredict(true)}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px 0', borderRadius: 14, background: '#006A33', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'opacity 0.15s' }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          <Zap style={{ width: 14, height: 14 }} /> Hacer predicción
        </button>
      )}
    </div>
  )
}

// ─── Stat tile ────────────────────────────────────────────────────────────────

function StatTile({
  label, value, sub, subColor, icon, iconBg,
}: {
  label: string; value: string | number; sub?: string; subColor?: string
  icon: React.ReactNode; iconBg: string
}) {
  return (
    <div className="flex flex-col items-center text-center py-2">
      <div className="flex items-center justify-center rounded-2xl mb-3" style={{ width: 48, height: 48, background: iconBg }}>
        {icon}
      </div>
      <p className="text-3xl font-bold mb-0.5 leading-none" style={{ fontFamily: 'var(--font-montserrat, system-ui)', color: '#fff' }}>
        {value}
      </p>
      <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.40)' }}>{label}</p>
      {sub && <p className="text-xs font-semibold" style={{ color: subColor ?? '#22c55e' }}>{sub}</p>}
    </div>
  )
}

// ─── Featured match panel (card + predict toggle) ────────────────────────────

function FeaturedMatchPanel({
  prediction, existingAnswer, voteData, localScore, onPredict,
}: {
  prediction: Prediction | null
  existingAnswer: string | null
  voteData: Record<string, number>
  localScore?: { home: number; away: number }
  onPredict: (answer: string, homeScore: number, awayScore: number) => void
}) {
  const [showPredict,   setShowPredict]   = useState(false)
  const [showSuccess,   setShowSuccess]   = useState(false)
  const [homeScore,     setHomeScore]     = useState(0)
  const [awayScore,     setAwayScore]     = useState(0)
  const [confirmedData, setConfirmedData] = useState<{ home: number; away: number; result: string } | null>(null)

  if (!prediction) {
    return (
      <div style={{ ...GLASS, padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, paddingTop: 48, paddingBottom: 48 }}>
        <Calendar style={{ width: 32, height: 32, color: 'rgba(255,255,255,0.20)' }} />
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.30)' }}>Sin partidos programados</p>
      </div>
    )
  }

  const [homeRaw, draw, awayRaw] = getOptions(prediction.options)
  const home     = getTeamNameES(homeRaw)
  const away     = getTeamNameES(awayRaw)
  const homeFlag = getFlagUrl(prediction.home_team_code)
  const awayFlag = getFlagUrl(prediction.away_team_code)
  const stage    = STAGE_LABELS[parseStage(prediction.description)] ?? 'Fase de Grupos'
  const ko       = kickoff(prediction)
  const open     = isMatchOpen(prediction)
  const answered = !!existingAnswer
  const canEdit  = answered && open
  const isFootball = !!(prediction.home_team_code && prediction.away_team_code)

  const total = Object.values(voteData).reduce((a, b) => a + b, 0)
  const pct   = (key: string) => total > 0 ? Math.round((voteData[key] ?? 0) / total * 100) : 0

  // ── State 3: success ──────────────────────────────────────────────────────
  if (showSuccess && confirmedData) {
    const resultColor = confirmedData.result === home ? '#00C46A' : confirmedData.result === away ? '#4d9fff' : '#6E7A99'
    const waText = encodeURIComponent(
      `Predije ${home} ${confirmedData.home}-${confirmedData.away} ${away} en TU MUNDIAL 🏆⚽\n¿Vos qué decís? https://tu-mundial.vercel.app/`
    )
    return (
      <div className="animate-fade-in" style={{ ...GLASS, padding: 28, textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#006A33', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '24px auto 16px' }}>
          <CheckCircle style={{ width: 32, height: 32, color: '#fff' }} />
        </div>
        <h3 style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: '0 0 12px' }}>¡Predicción guardada!</h3>
        <p style={{ fontSize: 28, fontWeight: 900, color: '#fff', margin: '0 0 4px', fontFamily: 'var(--font-montserrat, system-ui)' }}>
          {confirmedData.home} – {confirmedData.away}
        </p>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', margin: '0 0 8px' }}>
          Ganará: <strong style={{ color: resultColor }}>{confirmedData.result}</strong>
        </p>
        <p style={{ fontSize: 12, color: '#F6B73C', margin: '0 0 20px' }}>
          +8 pts si acertás el marcador exacto
        </p>
        <button
          onClick={() => window.open(`https://wa.me/?text=${waText}`, '_blank')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12, background: '#25D366', color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
          </svg>
          Compartir en WhatsApp
        </button>
      </div>
    )
  }

  // ── State 2: score picker ──────────────────────────────────────────────────
  if (showPredict && open && isFootball) {
    const deduced = deduceResult(homeScore, awayScore, home, away, draw)
    return (
      <div className="animate-fade-in" style={{ ...GLASS, padding: 28 }}>
        <button
          onClick={() => setShowPredict(false)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'rgba(255,255,255,0.50)', cursor: 'pointer', fontSize: 13, fontWeight: 600, marginBottom: 16, padding: 0 }}
          onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.50)')}
        >
          ← Volver
        </button>
        <p style={{ textAlign: 'center', fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 8, letterSpacing: '0.1em', fontWeight: 700 }}>
          {canEdit ? 'CAMBIAR PREDICCIÓN' : '¿CUÁL SERÁ EL MARCADOR?'}
        </p>
        <ScorePicker home={home} away={away} homeFlag={homeFlag} awayFlag={awayFlag}
          homeScore={homeScore} awayScore={awayScore} setHomeScore={setHomeScore} setAwayScore={setAwayScore} />
        <p className="text-center text-sm mb-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
          Ganará: <strong style={{ color: homeScore > awayScore ? '#00C46A' : awayScore > homeScore ? '#4d9fff' : '#6E7A99' }}>{deduced}</strong>
        </p>
        <p className="text-center text-xs mb-4">
          <span style={{ color: '#00C46A' }}>+3 pts resultado</span>
          <span style={{ color: 'rgba(255,255,255,0.25)', margin: '0 5px' }}>·</span>
          <span style={{ color: '#F6B73C' }}>+8 pts exacto</span>
        </p>
        <button
          onClick={() => {
            setConfirmedData({ home: homeScore, away: awayScore, result: deduced })
            onPredict(deduced, homeScore, awayScore)
            setShowSuccess(true)
            setTimeout(() => {
              setShowPredict(false)
              setShowSuccess(false)
              setConfirmedData(null)
            }, 2000)
          }}
          className="w-full text-white font-semibold text-base rounded-2xl transition-colors"
          style={{ padding: '14px 0', background: '#006A33', border: 'none', cursor: 'pointer' }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#005828' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#006A33' }}
        >
          {canEdit ? 'Guardar cambio' : 'Confirmar predicción'}
        </button>
      </div>
    )
  }

  // ── State 1: match info + vote bars ───────────────────────────────────────
  return (
    <div className="animate-fade-in" style={{ ...GLASS, padding: 28 }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.35)', margin: 0, marginBottom: 2 }}>PARTIDO DESTACADO</p>
        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', margin: 0 }}>{stage.toUpperCase()}</p>
      </div>

      {/* Teams */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flex: 1 }}>
          {homeFlag
            ? <img src={homeFlag} alt={home} style={{ width: 88, height: 62, objectFit: 'cover', borderRadius: 10 }} />
            : <div style={{ width: 88, height: 62, borderRadius: 10, background: 'rgba(255,255,255,0.10)' }} />
          }
          <p style={{ fontWeight: 700, fontSize: 15, textAlign: 'center', color: '#fff', lineHeight: 1.2, margin: 0 }}>{home}</p>
        </div>
        <p style={{ fontSize: 28, fontWeight: 900, color: 'rgba(255,255,255,0.20)', fontFamily: 'var(--font-montserrat, system-ui)', padding: '0 16px', margin: 0 }}>VS</p>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flex: 1 }}>
          {awayFlag
            ? <img src={awayFlag} alt={away} style={{ width: 88, height: 62, objectFit: 'cover', borderRadius: 10 }} />
            : <div style={{ width: 88, height: 62, borderRadius: 10, background: 'rgba(255,255,255,0.10)' }} />
          }
          <p style={{ fontWeight: 700, fontSize: 15, textAlign: 'center', color: '#fff', lineHeight: 1.2, margin: 0 }}>{away}</p>
        </div>
      </div>

      {/* Date */}
      <p style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.45)', marginBottom: 28 }}>
        {pyDateTimeMed(ko).toUpperCase()}
      </p>

      {/* CTA or answered state */}
      {answered ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.18)', borderRadius: 14 }}>
          <CheckCircle style={{ width: 16, height: 16, color: '#22c55e', flexShrink: 0 }} />
          <p style={{ fontSize: 13, fontWeight: 600, color: '#22c55e', margin: 0, flex: 1 }}>
            Pronosticaste: <span style={{ fontWeight: 700 }}>{existingAnswer}</span>
            {localScore != null && <span style={{ color: 'rgba(255,255,255,0.45)', fontWeight: 400 }}> · {localScore.home}–{localScore.away}</span>}
          </p>
          {canEdit && (
            <button
              onClick={() => { setHomeScore(localScore?.home ?? 0); setAwayScore(localScore?.away ?? 0); setShowPredict(true) }}
              style={{ flexShrink: 0, fontSize: 12, fontWeight: 700, color: '#F6B73C', background: 'none', border: '1px solid rgba(246,183,60,0.30)', borderRadius: 8, padding: '4px 12px', cursor: 'pointer' }}
            >
              Editar
            </button>
          )}
        </div>
      ) : open && isFootball ? (
        <button
          onClick={() => setShowPredict(true)}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '16px 0', borderRadius: 16, background: '#006A33', border: 'none', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', transition: 'opacity 0.15s' }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          <Zap style={{ width: 16, height: 16 }} /> Hacer predicción
        </button>
      ) : null}
    </div>
  )
}
// ─── Match row ────────────────────────────────────────────────────────────────

function MatchRow({
  prediction, existingAnswer, localScore, vote, onExpand, onEditClick,
}: {
  prediction: Prediction
  existingAnswer: string | null
  localScore?: { home: number; away: number }
  vote?: { isCorrect: boolean | null; pointsEarned: number | null }
  onExpand: () => void
  onEditClick: () => void
}) {
  const [homeRaw, , awayRaw] = getOptions(prediction.options)
  const home     = getTeamNameES(homeRaw)
  const away     = getTeamNameES(awayRaw)
  const homeFlag = getFlagUrl(prediction.home_team_code)
  const awayFlag = getFlagUrl(prediction.away_team_code)
  const stage    = STAGE_LABELS[parseStage(prediction.description)] ?? 'Grupos'
  const ko       = kickoff(prediction)
  const open     = isMatchOpen(prediction)

  const isResolved  = prediction.status === 'resolved'
  const hasMyAnswer = !!existingAnswer
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pred = prediction as any

  const isCorrect    = vote?.isCorrect    ?? false
  const pointsEarned = vote?.pointsEarned ?? 0
  const isExact      = pointsEarned >= 8

  const rowBorder = isResolved && hasMyAnswer
    ? isCorrect ? 'rgba(0,196,106,0.30)' : 'rgba(206,17,38,0.25)'
    : 'rgba(255,255,255,0.07)'
  const rowBg = isResolved && hasMyAnswer
    ? isCorrect ? 'rgba(0,196,106,0.05)' : 'rgba(206,17,38,0.04)'
    : 'rgba(255,255,255,0.04)'

  return (
    <div style={{ background: rowBg, border: `1px solid ${rowBorder}`, borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>

      {/* Time / stage */}
      <div style={{ width: 44, flexShrink: 0 }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: '#fff', margin: 0 }}>{pyTime(ko)}</p>
        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.30)', margin: 0 }}>{stage}</p>
      </div>

      {/* Teams */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'nowrap', overflow: 'hidden' }}>
        {homeFlag
          ? <img src={homeFlag} alt={home} style={{ width: 18, height: 13, objectFit: 'cover', borderRadius: 2, flexShrink: 0 }} />
          : <div style={{ width: 18, height: 13, borderRadius: 2, background: 'rgba(255,255,255,0.10)', flexShrink: 0 }} />}
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{home}</span>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', flexShrink: 0 }}>vs</span>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{away}</span>
        {awayFlag
          ? <img src={awayFlag} alt={away} style={{ width: 18, height: 13, objectFit: 'cover', borderRadius: 2, flexShrink: 0 }} />
          : <div style={{ width: 18, height: 13, borderRadius: 2, background: 'rgba(255,255,255,0.10)', flexShrink: 0 }} />}
      </div>

      {/* Result (if played and scores available) */}
      {isResolved && pred.exact_score_home != null && pred.exact_score_away != null && (
        <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', background: 'rgba(255,255,255,0.08)', borderRadius: 7, padding: '3px 8px', flexShrink: 0 }}>
          {pred.exact_score_home}–{pred.exact_score_away}
        </div>
      )}

      {/* My prediction */}
      {hasMyAnswer ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, flexShrink: 0, minWidth: 62 }}>
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.30)', letterSpacing: '0.05em', fontWeight: 700 }}>TU PRONÓSTICO</span>
          {isResolved ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: isCorrect ? '#00C46A' : '#CE1126' }}>
              <span style={{ width: 14, height: 14, borderRadius: '50%', background: isCorrect ? 'rgba(0,196,106,0.15)' : 'rgba(206,17,38,0.15)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {isCorrect
                  ? <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#00C46A" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                  : <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#CE1126" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12"/></svg>}
              </span>
              {localScore != null ? `${localScore.home}–${localScore.away}` : existingAnswer}
            </span>
          ) : (
            <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.65)' }}>
              {localScore != null ? `${localScore.home}–${localScore.away}` : existingAnswer}
            </span>
          )}
        </div>
      ) : isResolved ? (
        <div style={{ minWidth: 62, flexShrink: 0 }} />
      ) : null}

      {/* Action / Points */}
      <div style={{ flexShrink: 0 }}>
        {isResolved && hasMyAnswer ? (
          <span style={{
            fontSize: 11, fontWeight: 800, borderRadius: 6, padding: '3px 7px',
            background: isExact ? 'rgba(0,196,106,0.15)' : isCorrect ? 'rgba(77,159,255,0.15)' : 'rgba(206,17,38,0.12)',
            color: isExact ? '#00C46A' : isCorrect ? '#4d9fff' : '#CE1126',
          }}>
            +{pointsEarned}
          </span>
        ) : !isResolved && hasMyAnswer ? (
          open ? (
            <button
              onClick={e => { e.stopPropagation(); onEditClick() }}
              style={{ fontSize: 12, border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.55)', background: 'transparent', padding: '4px 10px', borderRadius: 8, cursor: 'pointer' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)' }}
            >
              Editar
            </button>
          ) : null
        ) : !isResolved && !hasMyAnswer && open ? (
          <button
            onClick={e => { e.stopPropagation(); onExpand() }}
            style={{ fontSize: 12, background: '#0052A5', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            Pronostica
          </button>
        ) : null}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  userId: string
  points: number
  rank: number
  predictions: Prediction[]
  existingAnswers: Record<string, string>
  existingScores?: Record<string, { home: number; away: number }>
  existingVotes?: Record<string, { isCorrect: boolean | null; pointsEarned: number | null }>
  voteDistributions: Record<string, Record<string, number>>
  onPredict: (predictionId: string, answer: string, homeScore: number, awayScore: number) => void
  onGoToMisPredicciones: () => void
  onCalendarioClick: () => void
}

export default function InicioView({
  points, rank, predictions, existingAnswers, existingScores, existingVotes, voteDistributions,
  onPredict, onGoToMisPredicciones, onCalendarioClick,
}: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(t)
  }, [])

  const liveMatch = useMemo(() => predictions.find(p => {
    if (!p.home_team_code || !p.away_team_code) return false
    const start = new Date(p.deadline ?? 0)
    const diff = (now.getTime() - start.getTime()) / 60000
    return diff >= 0 && diff <= 120
  }), [predictions, now])

  const nextMatch = useMemo(() => {
    const sorted = predictions
      .filter(p => p.home_team_code && p.away_team_code && new Date(p.deadline ?? 0) > now)
      .sort((a, b) => new Date(a.deadline ?? 0).getTime() - new Date(b.deadline ?? 0).getTime())
    return sorted[0] ?? null
  }, [predictions, now])

  const openPredictions = useMemo(
    () => predictions.filter(p => p.status === 'open' && new Date(p.deadline ?? 0) > now),
    [predictions, now]
  )

  const featured = useMemo(
    () => openPredictions.find(p => !existingAnswers[p.id]) ?? openPredictions[0] ?? predictions[0] ?? null,
    [openPredictions, existingAnswers, predictions]
  )

  const matchdays = useMemo(() => {
    const map: Record<string, Prediction[]> = {}
    for (const p of predictions) {
      if (!p.deadline) continue
      const d = new Date(p.deadline)
      if (isNaN(d.getTime())) continue
      const key = pyISODate(d)
      if (!map[key]) map[key] = []
      map[key].push(p)
    }
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, preds]) => ({
        date,
        preds: preds.sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime()),
      }))
  }, [predictions])

  const [dayIdx, setDayIdx] = useState(0)

  useEffect(() => {
    if (matchdays.length === 0) return
    const today = pyISODate(new Date())
    const i = matchdays.findIndex(m => m.date >= today)
    setDayIdx(i === -1 ? matchdays.length - 1 : i)
  }, [matchdays])

  const totalAnswered = Object.keys(existingAnswers).length
  const pendingCount  = openPredictions.filter(p => !existingAnswers[p.id]).length

  const [expandedEditId, setExpandedEditId] = useState<string | null>(null)

  const handleExpand = (id: string) => {
    setExpandedId(prev => {
      if (prev === id) { setExpandedEditId(null); return null }
      return id
    })
  }

  const handleEditClick = (id: string) => {
    setExpandedId(id)
    setExpandedEditId(id)
  }

  const handlePredict = useCallback((predictionId: string, answer: string, homeScore: number, awayScore: number) => {
    setExpandedId(null)
    setExpandedEditId(null)
    onPredict(predictionId, answer, homeScore, awayScore)
  }, [onPredict])

  return (
    <div>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-1" style={{ fontFamily: 'var(--font-montserrat, system-ui)', color: '#fff' }}>
            Predicciones
          </h1>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.40)' }}>
            Vive el mundial, pronostica cada partido y compite con tus amigos.
          </p>
        </div>
        <button
          onClick={onCalendarioClick}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold shrink-0"
          style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.60)', cursor: 'pointer', transition: 'border-color 0.15s, color 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; e.currentTarget.style.color = '#fff' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'rgba(255,255,255,0.60)' }}
        >
          <Calendar className="h-4 w-4" /> Calendario
        </button>
      </div>

      {/* ── 2-column grid ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6">

        {/* ── LEFT ────────────────────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Featured match */}
          <FeaturedMatchPanel
            key={featured?.id ?? 'none'}
            prediction={featured}
            existingAnswer={featured ? (existingAnswers[featured.id] ?? null) : null}
            voteData={featured ? (voteDistributions[featured.id] ?? {}) : {}}
            localScore={featured ? existingScores?.[featured.id] : undefined}
            onPredict={(answer, hs, as) => featured && handlePredict(featured.id, answer, hs, as)}
          />

          {/* Match list */}
          {matchdays.length > 0 && (
            <div>
              {/* Header: title + day nav inline */}
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-black uppercase tracking-wider" style={{ color: '#fff', fontFamily: 'var(--font-montserrat, system-ui)' }}>
                  Partidos
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setDayIdx(i => Math.max(0, i - 1))}
                    disabled={dayIdx === 0}
                    style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 6, cursor: dayIdx === 0 ? 'not-allowed' : 'pointer', opacity: dayIdx === 0 ? 0.3 : 1, color: '#fff' }}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.70)', minWidth: 40, textAlign: 'center' }}>
                    Día {dayIdx + 1}
                  </span>
                  <button
                    onClick={() => setDayIdx(i => Math.min(matchdays.length - 1, i + 1))}
                    disabled={dayIdx === matchdays.length - 1}
                    style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 6, cursor: dayIdx === matchdays.length - 1 ? 'not-allowed' : 'pointer', opacity: dayIdx === matchdays.length - 1 ? 0.3 : 1, color: '#fff' }}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Date label */}
              <p className="text-xs mb-3 capitalize" style={{ color: 'rgba(255,255,255,0.40)' }}>
                {pyDateLabel(matchdays[dayIdx].date)}
              </p>

              {/* Matches for current day */}
              <div className="space-y-1.5">
                {matchdays[dayIdx].preds.map(p => (
                  <div key={p.id}>
                    <MatchRow
                      prediction={p}
                      existingAnswer={existingAnswers[p.id] ?? null}
                      localScore={existingScores?.[p.id]}
                      vote={existingVotes?.[p.id]}
                      onExpand={() => handleExpand(p.id)}
                      onEditClick={() => handleEditClick(p.id)}
                    />
                    {expandedId === p.id && (
                      <PredictPanel
                        key={`${p.id}-${expandedEditId === p.id ? 'edit' : 'view'}`}
                        prediction={p}
                        existingAnswer={existingAnswers[p.id] ?? null}
                        voteData={voteDistributions[p.id] ?? {}}
                        loading={false}
                        submitting={false}
                        localScore={existingScores?.[p.id]}
                        initialEditMode={expandedEditId === p.id}
                        onPredict={(answer, hs, as) => handlePredict(p.id, answer, hs, as)}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px 16px', marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'rgba(255,255,255,0.40)' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(0,196,106,0.50)', border: '1px solid #00C46A' }} />
                  Acertaste
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'rgba(255,255,255,0.40)' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(206,17,38,0.40)', border: '1px solid #CE1126' }} />
                  Fallaste
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'rgba(255,255,255,0.40)' }}>
                  <span style={{ fontSize: 10, fontWeight: 800, borderRadius: 5, padding: '2px 6px', background: 'rgba(0,196,106,0.15)', color: '#00C46A' }}>+8</span>
                  Marcador exacto
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'rgba(255,255,255,0.40)' }}>
                  <span style={{ fontSize: 10, fontWeight: 800, borderRadius: 5, padding: '2px 6px', background: 'rgba(77,159,255,0.15)', color: '#4d9fff' }}>+3</span>
                  Resultado correcto
                </div>
              </div>

              {/* Ver calendario completo */}
              <button
                onClick={onCalendarioClick}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#006A33', fontSize: 12, fontWeight: 600, marginTop: 10, display: 'block', marginLeft: 'auto' }}
              >
                Ver calendario completo →
              </button>
            </div>
          )}
        </div>

        {/* ── RIGHT ───────────────────────────────────────────────────── */}
        <div className="space-y-6">
          <div style={{ ...GLASS, padding: 24 }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-black" style={{ color: '#fff', fontFamily: 'var(--font-montserrat, system-ui)' }}>
                MIS ESTADÍSTICAS
              </h3>
              <button
                onClick={onGoToMisPredicciones}
                className="text-xs font-semibold"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#006A33' }}
              >
                Ver todas →
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <StatTile
                label="Predicciones"
                value={totalAnswered}
                sub={pendingCount > 0 ? `${pendingCount} pendiente${pendingCount !== 1 ? 's' : ''}` : undefined}
                subColor="rgba(255,255,255,0.35)"
                icon={<Target className="h-5 w-5" style={{ color: '#60a5fa' }} />}
                iconBg="rgba(0,82,165,0.15)"
              />
              <StatTile
                label="Abiertos"
                value={openPredictions.length}
                sub={openPredictions.length > 0 ? 'disponibles' : undefined}
                subColor="rgba(255,255,255,0.35)"
                icon={<Zap className="h-5 w-5" style={{ color: '#22c55e' }} />}
                iconBg="rgba(34,197,94,0.15)"
              />
              <StatTile
                label="Puntos"
                value={points.toLocaleString('es')}
                icon={<Trophy className="h-5 w-5" style={{ color: '#F6B73C' }} />}
                iconBg="rgba(246,183,60,0.15)"
              />
              <StatTile
                label="Posición"
                value={`#${rank}`}
                icon={<BarChart3 className="h-5 w-5" style={{ color: '#a78bfa' }} />}
                iconBg="rgba(167,139,250,0.15)"
              />
            </div>
          </div>
          {/* ── PARTIDO EN VIVO ──────────────────────────────────────── */}
          {liveMatch && (() => {
            const [homeRaw,, awayRaw] = getOptions(liveMatch.options)
            const home = getTeamNameES(homeRaw)
            const away = getTeamNameES(awayRaw)
            const homeFlag = getFlagUrl(liveMatch.home_team_code)
            const awayFlag = getFlagUrl(liveMatch.away_team_code)
            const score    = existingScores?.[liveMatch.id]
            const answered = existingAnswers[liveMatch.id]
            return (
              <div className="rounded-2xl p-4" style={{ background: 'rgba(206,17,38,0.10)', border: '1px solid rgba(206,17,38,0.30)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-[#CE1126] animate-pulse" />
                  <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#CE1126' }}>En vivo ahora</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {homeFlag && <img src={homeFlag} alt={home} className="w-8 h-6 rounded object-cover" />}
                    <span className="text-sm font-bold text-white">{home}</span>
                  </div>
                  <span className="text-xs px-3" style={{ color: 'rgba(255,255,255,0.40)' }}>VS</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{away}</span>
                    {awayFlag && <img src={awayFlag} alt={away} className="w-8 h-6 rounded object-cover" />}
                  </div>
                </div>
                {answered && (
                  <p className="text-xs text-center mt-2" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    Tu predicción:{' '}
                    <span className="text-white font-medium">
                      {score ? `${answered} ${score.home}–${score.away}` : answered}
                    </span>
                  </p>
                )}
              </div>
            )
          })()}

          {/* ── PRÓXIMO PARTIDO ──────────────────────────────────────── */}
          {!liveMatch && nextMatch && (() => {
            const [homeRaw,, awayRaw] = getOptions(nextMatch.options)
            const home = getTeamNameES(homeRaw)
            const away = getTeamNameES(awayRaw)
            const homeFlag = getFlagUrl(nextMatch.home_team_code)
            const awayFlag = getFlagUrl(nextMatch.away_team_code)
            return (
              <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p className="text-xs uppercase tracking-wide mb-2" style={{ color: 'rgba(255,255,255,0.40)' }}>
                  Próximo partido
                </p>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {homeFlag && <img src={homeFlag} alt={home} className="w-7 h-5 rounded object-cover" />}
                    <span className="text-sm font-bold text-white">{home}</span>
                  </div>
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.30)' }}>vs</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{away}</span>
                    {awayFlag && <img src={awayFlag} alt={away} className="w-7 h-5 rounded object-cover" />}
                  </div>
                </div>
                <CountdownTimer deadline={nextMatch.deadline ?? ''} />
              </div>
            )
          })()}
        </div>
      </div>
    </div>
  )
}
