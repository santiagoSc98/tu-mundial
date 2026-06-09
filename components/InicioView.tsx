'use client'

import { useMemo, useRef, useState, useCallback } from 'react'
import {
  Calendar, Target, Trophy, CheckCircle, BarChart3, Zap, Clock,
} from 'lucide-react'
import { getFlagUrl } from '@/lib/flagCodes'
import { pyISODate, pyTime, pyDateTimeMed, pyDateLabel, getTeamNameES } from '@/lib/worldcup'
import { createClient } from '@/lib/supabase/client'
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
  prediction, existingAnswer, voteData, loading, submitting, onPredict, localScore,
}: {
  prediction: Prediction
  existingAnswer: string | null
  voteData: Record<string, number>
  loading: boolean
  submitting: boolean
  onPredict: (answer: string, homeScore: number, awayScore: number) => void
  localScore?: { home: number; away: number }
}) {
  const [homeRaw, draw, awayRaw] = getOptions(prediction.options)
  const home     = getTeamNameES(homeRaw)
  const away     = getTeamNameES(awayRaw)
  const homeFlag = getFlagUrl(prediction.home_team_code)
  const awayFlag = getFlagUrl(prediction.away_team_code)
  const open     = isMatchOpen(prediction)
  const answered = !!existingAnswer
  const isFootball = !!(prediction.home_team_code && prediction.away_team_code)

  // Start directly in picker mode for unanswered open football matches
  const [showPredict, setShowPredict] = useState(() => !answered && open && isFootball)
  const [homeScore,   setHomeScore]   = useState(0)
  const [awayScore,   setAwayScore]   = useState(0)

  const total = Object.values(voteData).reduce((a, b) => a + b, 0)
  const pct   = (key: string) => total > 0 ? Math.round((voteData[key] ?? 0) / total * 100) : 0

  const outer: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 20, marginTop: 8, padding: 20,
  }

  // ── State 2: score picker ──────────────────────────────────────────────────
  if (showPredict && open && !answered && isFootball) {
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
          ¿CUÁL SERÁ EL MARCADOR?
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
          Confirmar predicción
        </button>
      </div>
    )
  }

  // ── State 1: vote bars + CTA ───────────────────────────────────────────────
  return (
    <div className="animate-fade-in" style={outer}>
      {answered && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.18)', borderRadius: 14, marginBottom: 14 }}>
          <CheckCircle style={{ width: 16, height: 16, color: '#22c55e', flexShrink: 0 }} />
          <p style={{ fontSize: 13, fontWeight: 600, color: '#22c55e', margin: 0 }}>
            Predicaste: <span style={{ fontWeight: 700 }}>{existingAnswer}</span>
            {localScore != null && <span style={{ color: 'rgba(255,255,255,0.45)', fontWeight: 400 }}> · {localScore.home}–{localScore.away}</span>}
          </p>
        </div>
      )}
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
  const isFootball = !!(prediction.home_team_code && prediction.away_team_code)

  const total = Object.values(voteData).reduce((a, b) => a + b, 0)
  const pct   = (key: string) => total > 0 ? Math.round((voteData[key] ?? 0) / total * 100) : 0

  // ── State 3: success ──────────────────────────────────────────────────────
  if (showSuccess && confirmedData) {
    const resultColor = confirmedData.result === home ? '#00C46A' : confirmedData.result === away ? '#4d9fff' : '#6E7A99'
    return (
      <div className="animate-fade-in" style={{ ...GLASS, padding: 28, textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#006A33', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '24px auto 16px' }}>
          <CheckCircle style={{ width: 32, height: 32, color: '#fff' }} />
        </div>
        <h3 style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: '0 0 12px' }}>¡Predicción guardada!</h3>
        <p style={{ fontSize: 28, fontWeight: 900, color: '#fff', margin: '0 0 4px', fontFamily: 'var(--font-montserrat, system-ui)' }}>
          {confirmedData.home} – {confirmedData.away}
        </p>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', margin: '0 0 16px' }}>
          Ganará: <strong style={{ color: resultColor }}>{confirmedData.result}</strong>
        </p>
        <p style={{ fontSize: 12, color: '#F6B73C', margin: '0 0 24px' }}>
          +8 pts si acertás el marcador exacto
        </p>
      </div>
    )
  }

  // ── State 2: score picker ──────────────────────────────────────────────────
  if (showPredict && open && !answered && isFootball) {
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
          ¿CUÁL SERÁ EL MARCADOR?
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
          Confirmar predicción
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
          <p style={{ fontSize: 13, fontWeight: 600, color: '#22c55e', margin: 0 }}>
            Predicaste: <span style={{ fontWeight: 700 }}>{existingAnswer}</span>
            {localScore != null && <span style={{ color: 'rgba(255,255,255,0.45)', fontWeight: 400 }}> · {localScore.home}–{localScore.away}</span>}
          </p>
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
  prediction, answered, onExpand,
}: {
  prediction: Prediction
  answered: boolean
  onExpand: () => void
}) {
  const [homeRaw, , awayRaw] = getOptions(prediction.options)
  const home     = getTeamNameES(homeRaw)
  const away     = getTeamNameES(awayRaw)
  const homeFlag = getFlagUrl(prediction.home_team_code)
  const awayFlag = getFlagUrl(prediction.away_team_code)
  const stage    = STAGE_LABELS[parseStage(prediction.description)] ?? ''
  const ko       = kickoff(prediction)
  const open     = isMatchOpen(prediction)

  return (
    <div
      className="flex items-center justify-between gap-3 px-4 py-3"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, transition: 'background 0.12s' }}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
    >
      <div className="shrink-0 w-14 text-right">
        <p className="text-xs font-semibold" style={{ color: '#fff' }}>{pyTime(ko)}</p>
        {stage && <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.30)' }}>{stage}</p>}
      </div>

      <div className="flex items-center gap-2 flex-1 min-w-0">
        {homeFlag
          ? <img src={homeFlag} alt={home} style={{ width: 24, height: 17, objectFit: 'cover', borderRadius: 3, flexShrink: 0 }} />
          : <div style={{ width: 24, height: 17, borderRadius: 3, background: 'rgba(255,255,255,0.10)', flexShrink: 0 }} />
        }
        <span className="text-xs font-medium truncate" style={{ color: 'rgba(255,255,255,0.70)' }}>{home}</span>
        <span className="text-xs shrink-0" style={{ color: 'rgba(255,255,255,0.25)' }}>vs</span>
        <span className="text-xs font-medium truncate" style={{ color: 'rgba(255,255,255,0.70)' }}>{away}</span>
        {awayFlag
          ? <img src={awayFlag} alt={away} style={{ width: 24, height: 17, objectFit: 'cover', borderRadius: 3, flexShrink: 0 }} />
          : <div style={{ width: 24, height: 17, borderRadius: 3, background: 'rgba(255,255,255,0.10)', flexShrink: 0 }} />
        }
      </div>

      <div className="shrink-0">
        {answered ? (
          <button
            onClick={onExpand}
            className="flex items-center gap-1 text-xs font-semibold"
            style={{ color: '#22c55e', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <CheckCircle className="h-3.5 w-3.5" /> Ver votos
          </button>
        ) : open ? (
          <button
            onClick={onExpand}
            className="text-xs font-bold px-3 py-1.5 rounded-lg"
            style={{ background: 'rgba(0,82,165,0.15)', border: '1px solid rgba(0,82,165,0.30)', color: '#60a5fa', cursor: 'pointer' }}
          >
            Pronostica
          </button>
        ) : (
          <button
            onClick={onExpand}
            className="flex items-center text-xs"
            style={{ color: 'rgba(255,255,255,0.25)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <Clock className="h-3.5 w-3.5 mr-1" />Ver votos
          </button>
        )}
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
  voteDistributions: Record<string, Record<string, number>>
  onGoToPredicciones: () => void
  onCalendarioClick: () => void
}

export default function InicioView({
  userId, points, rank, predictions, existingAnswers, existingScores, voteDistributions,
  onGoToPredicciones, onCalendarioClick,
}: Props) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = useRef(createClient() as any).current

  const [expandedId,    setExpandedId]   = useState<string | null>(null)
  const [localAnswers,  setLocalAnswers] = useState<Record<string, string>>({})
  const [localScores,   setLocalScores]  = useState<Record<string, { home: number; away: number }>>(() => existingScores ?? {})
  const [localVotes,    setLocalVotes]   = useState<Record<string, Record<string, number>>>(() => voteDistributions ?? {})
  const [predictError,  setPredictError] = useState<string | null>(null)

  const mergedAnswers = useMemo(
    () => ({ ...existingAnswers, ...localAnswers }),
    [existingAnswers, localAnswers]
  )

  const now = useMemo(() => new Date(), [])

  const openPredictions = useMemo(
    () => predictions.filter(p => p.status === 'open' && new Date(p.deadline ?? 0) > now),
    [predictions, now]
  )

  const featured = useMemo(
    () => openPredictions.find(p => !mergedAnswers[p.id]) ?? openPredictions[0] ?? predictions[0] ?? null,
    [openPredictions, mergedAnswers, predictions]
  )

  const byDate = useMemo(() => {
    const map: Record<string, Prediction[]> = {}
    predictions.forEach(p => {
      const key = pyISODate(kickoff(p))
      if (!map[key]) map[key] = []
      map[key].push(p)
    })
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b))
  }, [predictions])

  const totalAnswered = Object.keys(mergedAnswers).length
  const pendingCount  = openPredictions.filter(p => !mergedAnswers[p.id]).length

  // ── Expand / collapse ────────────────────────────────────────────────────────
  const handleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id)
  }

  // ── Revert helpers ───────────────────────────────────────────────────────────
  const revertPredict = useCallback((predictionId: string, answer: string) => {
    setLocalAnswers(prev => { const n = { ...prev }; delete n[predictionId]; return n })
    setLocalScores(prev  => { const n = { ...prev }; delete n[predictionId]; return n })
    setLocalVotes(prev => {
      const dist = { ...(prev[predictionId] ?? {}) }
      if ((dist[answer] ?? 0) > 1) dist[answer]--
      else delete dist[answer]
      return { ...prev, [predictionId]: dist }
    })
  }, [])

  const showPredictError = useCallback((msg: string) => {
    setPredictError(msg)
    setTimeout(() => setPredictError(null), 5000)
  }, [])

  // ── Save prediction (optimistic) ────────────────────────────────────────────
  const handlePredict = useCallback(async (predictionId: string, answer: string, homeScore: number, awayScore: number) => {
    if (mergedAnswers[predictionId]) return

    // Optimistic update
    setLocalAnswers(prev => ({ ...prev, [predictionId]: answer }))
    setLocalScores(prev => ({ ...prev, [predictionId]: { home: homeScore, away: awayScore } }))
    setLocalVotes(prev => {
      const dist = { ...(prev[predictionId] ?? {}) }
      dist[answer] = (dist[answer] ?? 0) + 1
      return { ...prev, [predictionId]: dist }
    })
    setExpandedId(null)

    try {
      console.log('[Predict] userId:', userId)
      console.log('[Predict] predictionId:', predictionId)
      console.log('[Predict] answer:', answer)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const insertPromise = (supabase as any)
        .from('user_predictions')
        .insert({
          user_id:                userId,
          prediction_id:          predictionId,
          predicted_answer:       answer,
          confidence_level:       50,
          home_score_prediction:  homeScore ?? null,
          away_score_prediction:  awayScore ?? null,
        })
        .select()

      const timeoutPromise = new Promise<{ data: null; error: Error }>(resolve =>
        setTimeout(() => resolve({ data: null, error: new Error('Insert timeout (10s)') }), 10000)
      )

      const { data, error } = await Promise.race([insertPromise, timeoutPromise])

      console.log('[Predict] resultado:', { data, error })

      if (error) {
        console.error('[Predict] ERROR:', error instanceof Error ? error.message : JSON.stringify(error))
        revertPredict(predictionId, answer)
        showPredictError(error instanceof Error ? error.message : (error as { message?: string }).message ?? 'Error al guardar predicción')
      }
    } catch (err) {
      console.error('[Predict] EXCEPTION:', err)
      revertPredict(predictionId, answer)
      showPredictError('Error de conexión')
    }
  }, [mergedAnswers, userId, supabase, revertPredict, showPredictError])

  return (
    <div>
      {/* ── Error toast ────────────────────────────────────────────────── */}
      {predictError && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          padding: '12px 18px', borderRadius: 14,
          background: 'rgba(239,68,68,0.13)',
          border: '1px solid rgba(239,68,68,0.35)',
          backdropFilter: 'blur(16px)',
          color: '#f87171', fontSize: 13, fontWeight: 600,
          boxShadow: '0 8px 32px rgba(0,0,0,0.30)',
          display: 'flex', alignItems: 'center', gap: 8,
          maxWidth: 320,
        }}>
          ⚠️ {predictError}
        </div>
      )}

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
            prediction={featured}
            existingAnswer={featured ? (mergedAnswers[featured.id] ?? null) : null}
            voteData={featured ? (localVotes[featured.id] ?? {}) : {}}
            localScore={featured ? localScores[featured.id] : undefined}
            onPredict={(answer, hs, as) => featured && handlePredict(featured.id, answer, hs, as)}
          />

          {/* Match list */}
          {byDate.length > 0 && (
            <div>
              <h3 className="text-base font-black mb-4 tracking-wider" style={{ color: '#fff', fontFamily: 'var(--font-montserrat, system-ui)' }}>
                PARTIDOS
              </h3>
              <div className="space-y-6">
                {byDate.map(([dateKey, matches]) => (
                  <div key={dateKey}>
                    <p className="text-xs font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.35)', letterSpacing: '0.05em' }}>
                      {pyDateLabel(dateKey).toUpperCase()}
                    </p>
                    <div className="space-y-2">
                      {matches.map(p => (
                        <div key={p.id}>
                          <MatchRow
                            prediction={p}
                            answered={!!mergedAnswers[p.id]}
                            onExpand={() => handleExpand(p.id)}
                          />
                          {expandedId === p.id && (
                            <PredictPanel
                              prediction={p}
                              existingAnswer={mergedAnswers[p.id] ?? null}
                              voteData={localVotes[p.id] ?? {}}
                              loading={false}
                              submitting={false}
                              localScore={localScores[p.id]}
                              onPredict={(answer, hs, as) => handlePredict(p.id, answer, hs, as)}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
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
                onClick={onGoToPredicciones}
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

          <button
            onClick={onCalendarioClick}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold"
            style={{ background: 'transparent', border: '1px solid rgba(0,106,51,0.30)', color: '#22c55e', cursor: 'pointer', transition: 'background 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,106,51,0.08)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <Calendar className="h-4 w-4" /> Ver calendario completo →
          </button>
        </div>
      </div>
    </div>
  )
}
