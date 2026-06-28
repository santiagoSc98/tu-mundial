'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getFlagUrl } from '@/lib/flagCodes'
import { pyISODate, pyTime, pyDateTimeMed, pyDateLabel, getTeamNameES } from '@/lib/worldcup'
import type { Database } from '@/lib/database.types'
import type { GroupTeam, StandingsByType } from '@/lib/grupos'

type Prediction = Database['public']['Tables']['predictions']['Row']
type CalTab = 'resumen' | 'clasificacion' | 'eliminatoria'

// WC_START is derived from predictions at runtime (see component)

// ─── Bracket data ─────────────────────────────────────────────────────────────
interface BSlot { s1: string; s2: string; date: string }
const TBD = (date: string): BSlot => ({ s1: 'TBD', s2: 'TBD', date })

// Left side (outer → inner, top → bottom)
const L_R32: BSlot[] = [
  { s1: '1A', s2: '2B', date: '27 jun' },
  { s1: '1C', s2: '2D', date: '27 jun' },
  { s1: '1E', s2: '2F', date: '28 jun' },
  { s1: '1G', s2: '2H', date: '28 jun' },
  { s1: '1I', s2: '2J', date: '29 jun' },
  { s1: '1K', s2: '2L', date: '29 jun' },
  { s1: '3°A/B/C', s2: '3°D/E/F', date: '30 jun' },
  { s1: '3°G/H/I', s2: '3°J/K/L', date: '30 jun' },
]
const L_R16: BSlot[] = [TBD('4 jul'), TBD('4 jul'), TBD('5 jul'), TBD('5 jul')]
const L_QF:  BSlot[] = [TBD('9 jul'), TBD('9 jul')]
const L_SF:  BSlot   = TBD('15 jul')

// Right side (inner → outer, top → bottom — mirror)
const R_R32: BSlot[] = [
  { s1: '1B', s2: '2A', date: '27 jun' },
  { s1: '1D', s2: '2C', date: '28 jun' },
  { s1: '1F', s2: '2E', date: '29 jun' },
  { s1: '1H', s2: '2G', date: '29 jun' },
  { s1: '1J', s2: '2I', date: '30 jun' },
  { s1: '1L', s2: '2K', date: '1 jul' },
  { s1: '3°A/B', s2: '3°C/D', date: '1 jul' },
  { s1: '3°E/F', s2: '3°G/H', date: '2 jul' },
]
const R_R16: BSlot[] = [TBD('7 jul'), TBD('7 jul'), TBD('8 jul'), TBD('8 jul')]
const R_QF:  BSlot[] = [TBD('12 jul'), TBD('12 jul')]
const R_SF:  BSlot   = TBD('16 jul')

const FINAL_M: BSlot = { s1: 'TBD', s2: 'TBD', date: '19 jul' }
const THIRD_M: BSlot = { s1: 'TBD', s2: 'TBD', date: '18 jul' }

// ─── Bracket visual constants ─────────────────────────────────────────────────
const SLOT_H   = 112   // height per R32 slot; 8 slots × 112 = 896 px total
const B_CARD_W = 118
const B_CONN_W = 32
const B_LINE   = 'rgba(255,255,255,0.22)'

// ─── Countdown hook ─────────────────────────────────────────────────────────
// Starts null so SSR never renders a value that differs from the client tick.
type Countdown = { days: number; hours: number; minutes: number; seconds: number }
function useCountdown(target: Date): Countdown | null {
  const [cd, setCd] = useState<Countdown | null>(null)
  useEffect(() => {
    const calc = (): Countdown => {
      const diff = Math.max(0, target.getTime() - Date.now())
      return {
        days:    Math.floor(diff / 86400000),
        hours:   Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000)  / 60000),
        seconds: Math.floor((diff % 60000)    / 1000),
      }
    }
    setCd(calc())
    const id = setInterval(() => setCd(calc()), 1000)
    return () => clearInterval(id)
  }, [target.getTime()])
  return cd
}

// ─── Flag component ───────────────────────────────────────────────────────────
function Flag({ tla, w = 22, h = 15 }: { tla?: string | null; w?: number; h?: number }) {
  const url = getFlagUrl(tla ?? null)
  if (!url) return <div style={{ width: w, height: h, background: 'rgba(255,255,255,0.10)', borderRadius: 2 }} />
  return <img src={url} alt={tla ?? ''} style={{ width: w, height: h, objectFit: 'cover', borderRadius: 2, flexShrink: 0 }} />
}

// ─── Compact group table (Resumen) ────────────────────────────────────────────
function CompactGroupTable({ letter, table }: { letter: string; table: GroupTeam[] }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 10,
      overflow: 'hidden',
    }}>
      <div className="flex items-center gap-2 px-3 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.03)' }}>
        <span className="text-xs font-black" style={{ color: '#006A33' }}>GRP</span>
        <span className="text-sm font-black" style={{ color: '#fff' }}>{letter}</span>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th className="text-left pl-3 pr-1 py-1" style={{ fontSize: 9, color: 'rgba(255,255,255,0.30)', fontWeight: 700, letterSpacing: '0.06em' }}>#</th>
            <th className="text-left px-1 py-1" style={{ fontSize: 9, color: 'rgba(255,255,255,0.30)', fontWeight: 700 }}>EQUIPO</th>
            <th className="text-center px-1 py-1" style={{ fontSize: 9, color: 'rgba(255,255,255,0.30)', fontWeight: 700 }}>J</th>
            <th className="text-center px-1 py-1" style={{ fontSize: 9, color: 'rgba(255,255,255,0.30)', fontWeight: 700 }}>G</th>
            <th className="text-center px-1 py-1" style={{ fontSize: 9, color: 'rgba(255,255,255,0.30)', fontWeight: 700 }}>E</th>
            <th className="text-center px-1 py-1" style={{ fontSize: 9, color: 'rgba(255,255,255,0.30)', fontWeight: 700 }}>P</th>
            <th className="text-center px-1 pr-3 py-1" style={{ fontSize: 9, color: 'rgba(255,255,255,0.30)', fontWeight: 700 }}>PTS</th>
          </tr>
        </thead>
        <tbody>
          {table.map((row, i) => {
            const qual = i < 2
            const third = i === 2
            return (
              <tr
                key={row.team.tla}
                style={{
                  borderTop: '1px solid rgba(255,255,255,0.05)',
                  borderLeft: `3px solid ${qual ? '#22c55e' : third ? '#f59e0b' : 'transparent'}`,
                }}
              >
                <td className="pl-2 pr-1 py-1.5 text-center" style={{ fontSize: 11, color: qual ? '#22c55e' : 'rgba(255,255,255,0.35)', fontWeight: 700, width: 20 }}>{i + 1}</td>
                <td className="px-1 py-1.5">
                  <div className="flex items-center gap-1.5">
                    <Flag tla={row.team.tla} w={18} h={12} />
                    <span style={{ fontSize: 11, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 90 }}>{getTeamNameES(row.team.name)}</span>
                  </div>
                </td>
                {[row.playedGames, row.won, row.draw, row.lost].map((v, j) => (
                  <td key={j} className="text-center px-1 py-1.5" style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>{v}</td>
                ))}
                <td className="text-center px-1 pr-3 py-1.5" style={{ fontSize: 12, fontWeight: 800, color: qual ? '#22c55e' : '#fff' }}>{row.points}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─── Full group table (Clasificación) ────────────────────────────────────────
function FullGroupTable({ letter, table }: { letter: string; table: GroupTeam[] }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 12,
      overflow: 'hidden',
    }}>
      <div className="flex items-center gap-2 px-4 py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.04)' }}>
        <span className="text-xs font-black tracking-widest" style={{ color: '#006A33' }}>GRUPO</span>
        <span className="text-base font-black" style={{ color: '#fff' }}>{letter}</span>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 420 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              {['#', 'Equipo', 'J', 'G', 'E', 'P', 'GF', 'GC', 'DG', 'PTS'].map(h => (
                <th
                  key={h}
                  className={`py-2 ${h === 'Equipo' ? 'text-left px-3' : 'text-center px-2'}`}
                  style={{ fontSize: 10, color: 'rgba(255,255,255,0.30)', fontWeight: 700, letterSpacing: '0.06em' }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.map((row, i) => {
              const qual = i < 2
              const third = i === 2
              const dg = row.goalDifference
              return (
                <tr
                  key={row.team.tla + i}
                  style={{
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                    borderLeft: `3px solid ${qual ? '#22c55e' : third ? '#f59e0b' : 'transparent'}`,
                    background: qual ? 'rgba(34,197,94,0.03)' : 'transparent',
                  }}
                >
                  <td className="py-3 text-center px-2" style={{ fontSize: 12, color: qual ? '#22c55e' : 'rgba(255,255,255,0.35)', fontWeight: 700 }}>{i + 1}</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <Flag tla={row.team.tla} w={22} h={15} />
                      <span style={{ fontSize: 13, color: '#fff', fontWeight: 500 }}>{getTeamNameES(row.team.name)}</span>
                    </div>
                  </td>
                  {[row.playedGames, row.won, row.draw, row.lost, row.goalsFor, row.goalsAgainst].map((v, j) => (
                    <td key={j} className="py-3 text-center px-2" style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>{v}</td>
                  ))}
                  <td className="py-3 text-center px-2" style={{ fontSize: 12, color: dg > 0 ? '#22c55e' : dg < 0 ? '#f87171' : 'rgba(255,255,255,0.55)' }}>
                    {dg > 0 ? `+${dg}` : dg}
                  </td>
                  <td className="py-3 text-center px-2" style={{ fontSize: 14, fontWeight: 800, color: qual ? '#22c55e' : '#fff' }}>{row.points}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Bracket components ───────────────────────────────────────────────────────
function BCard({ slot, isFinal = false, isThird = false }: { slot: BSlot; isFinal?: boolean; isThird?: boolean }) {
  const accent = isFinal ? '#FFD700' : isThird ? '#CD7F32' : 'rgba(255,255,255,0.12)'
  return (
    <div style={{ width: B_CARD_W, background: 'rgba(255,255,255,0.04)', border: `1px solid ${accent}`, borderRadius: 7, overflow: 'hidden', flexShrink: 0, boxShadow: isFinal ? '0 0 16px rgba(255,215,0,0.12)' : 'none' }}>
      <div style={{ padding: '2px 6px', borderBottom: `1px solid ${accent}`, background: isFinal ? 'rgba(255,215,0,0.08)' : 'rgba(255,255,255,0.03)', textAlign: 'center' }}>
        <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.06em', color: isFinal ? '#FFD700' : isThird ? '#CD7F32' : 'rgba(255,255,255,0.35)' }}>
          {isFinal ? '🏆 FINAL' : isThird ? '3° LUGAR' : slot.date.toUpperCase()}
        </span>
      </div>
      {[slot.s1, slot.s2].map((s, i) => (
        <div key={i} style={{ padding: '4px 6px', borderTop: i === 1 ? '1px solid rgba(255,255,255,0.07)' : 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 14, height: 9, background: 'rgba(255,255,255,0.08)', borderRadius: 1, flexShrink: 0 }} />
          <span style={{ fontSize: 10, color: s === 'TBD' ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.80)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 78 }}>
            {s}
          </span>
        </div>
      ))}
    </div>
  )
}

// Each card sits centered in a fixed-height slot so columns stay aligned
function RoundCol({ slots, slotH, label, phaseKey }: { slots: BSlot[]; slotH: number; label: string; phaseKey?: string }) {
  return (
    <div data-phase={phaseKey} style={{ flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
        <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.50)', whiteSpace: 'nowrap', padding: '2px 8px', background: 'rgba(255,255,255,0.06)', borderRadius: 9999, border: '1px solid rgba(255,255,255,0.10)' }}>
          {label}
        </span>
      </div>
      {slots.map((slot, i) => (
        <div key={i} style={{ height: slotH, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <BCard slot={slot} />
        </div>
      ))}
    </div>
  )
}

/**
 * Pair connectors between two adjacent rounds.
 *
 * Left bracket (converging, →): source has 2N cards, target has N cards.
 *   side='right' — vertical bar on the right edge of the connector.
 *   Horizontal stubs at 25% and 75% of each pairH touch the source cards.
 *   Target card sits adjacent on the right, centered at 50% (the midpoint).
 *
 * Right bracket (diverging, →): source has N cards, target has 2N cards.
 *   side='left' — vertical bar on the left edge of the connector.
 *   Horizontal stubs at 25% and 75% touch the target cards on the right.
 *   Source card sits adjacent on the left, centered at 50%.
 *
 * Math: with slotH per source slot, pairH = 2×slotH.
 *   Source card centers are at slotH/2 and slotH+slotH/2 = slotH×1.5.
 *   As % of pairH: 25% and 75%. This holds for any slotH. ✓
 */
function BConns({ pairCount, pairH, side }: { pairCount: number; pairH: number; side: 'left' | 'right' }) {
  return (
    <div style={{ flexShrink: 0, width: B_CONN_W, marginTop: 32 }}>
      {Array.from({ length: pairCount }).map((_, i) => (
        <div key={i} style={{ height: pairH, position: 'relative' }}>
          {/* Vertical bar */}
          <div style={{ position: 'absolute', top: '25%', bottom: '25%', [side]: 0, width: 1, background: B_LINE }} />
          {/* Horizontal stub at card A center */}
          <div style={{ position: 'absolute', top: '25%', left: 0, right: 0, height: 1, background: B_LINE }} />
          {/* Horizontal stub at card B center */}
          <div style={{ position: 'absolute', top: '75%', left: 0, right: 0, height: 1, background: B_LINE }} />
        </div>
      ))}
    </div>
  )
}

// ─── Knockout bracket components ─────────────────────────────────────────────
interface KOMatch {
  id: string
  homeName: string
  awayName: string
  homeCode: string | null
  awayCode: string | null
  homeScore: number | null
  awayScore: number | null
  status: string | null
  deadline: string | null
}

function BracketMatchCard({ match, side = 'left', highlight = false }: {
  match: KOMatch | null; side?: 'left' | 'right'; highlight?: boolean
}) {
  if (!match) {
    return (
      <div style={{ width: 110, minHeight: 48, border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.15)', fontStyle: 'italic' }}>TBD</span>
      </div>
    )
  }
  const isResolved = match.status === 'resolved'
  const homeWins   = isResolved && match.homeScore != null && match.awayScore != null && match.homeScore > match.awayScore
  const awayWins   = isResolved && match.homeScore != null && match.awayScore != null && match.awayScore > match.homeScore
  const isTBD      = match.homeName === 'TBD' && match.awayName === 'TBD'
  const homeFlag   = getFlagUrl(match.homeCode)
  const awayFlag   = getFlagUrl(match.awayCode)
  const ko         = match.deadline ? new Date(new Date(match.deadline).getTime() + 10 * 60 * 1000) : null
  const koValid    = ko && !isNaN(ko.getTime())

  const borderColor = highlight   ? 'rgba(255,215,0,0.40)'
    : isTBD      ? 'rgba(255,255,255,0.06)'
    : isResolved ? 'rgba(0,196,106,0.30)'
    : 'rgba(255,255,255,0.15)'
  const bgColor = highlight   ? 'rgba(255,215,0,0.06)'
    : isTBD      ? 'rgba(255,255,255,0.02)'
    : isResolved ? 'rgba(0,196,106,0.06)'
    : 'rgba(255,255,255,0.04)'

  const rowStyle = (wins: boolean): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: 4, padding: '4px 6px',
    flexDirection: side === 'right' ? 'row-reverse' : 'row',
    background: wins ? 'rgba(0,196,106,0.08)' : 'transparent',
  })
  const nameStyle = (wins: boolean): React.CSSProperties => ({
    fontSize: 10, flex: 1,
    textAlign: side === 'right' ? 'right' : 'left',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
    color: isTBD ? 'rgba(255,255,255,0.25)' : '#fff',
    fontWeight: wins ? 600 : 400,
  })
  const scoreStyle = (wins: boolean): React.CSSProperties => ({
    fontSize: 10, fontWeight: 700, flexShrink: 0,
    color: wins ? '#00C46A' : 'rgba(255,255,255,0.30)',
  })
  const flagEl = (flag: string | null) => flag
    ? <img src={flag} alt="" style={{ width: 16, height: 11, borderRadius: 2, objectFit: 'cover', flexShrink: 0 }} />
    : <div style={{ width: 16, height: 11, borderRadius: 2, background: 'rgba(255,255,255,0.10)', flexShrink: 0 }} />

  return (
    <div style={{ width: 110, border: `1px solid ${borderColor}`, borderRadius: 6, overflow: 'hidden', background: bgColor, opacity: isTBD ? 0.5 : 1, flexShrink: 0 }}>
      {koValid && (
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', padding: '2px 6px', borderBottom: '1px solid rgba(255,255,255,0.06)', textAlign: side === 'right' ? 'right' : 'left' }}>
          {pyDateLabel(pyISODate(ko!))} · {pyTime(ko!)}
        </div>
      )}
      <div style={rowStyle(homeWins)}>
        {flagEl(homeFlag)}
        <span style={nameStyle(homeWins)}>{match.homeName === 'TBD' ? '-' : match.homeName}</span>
        {isResolved && <span style={scoreStyle(homeWins)}>{match.homeScore}</span>}
      </div>
      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />
      <div style={rowStyle(awayWins)}>
        {flagEl(awayFlag)}
        <span style={nameStyle(awayWins)}>{match.awayName === 'TBD' ? '-' : match.awayName}</span>
        {isResolved && <span style={scoreStyle(awayWins)}>{match.awayScore}</span>}
      </div>
    </div>
  )
}

function BracketConnectorGroup({ count, side = 'left' }: { count: number; side?: 'left' | 'right' }) {
  const isLeft = side === 'left'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignSelf: 'stretch', width: 20, flexShrink: 0 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* spacer = 1/4 of connector height = center of top card */}
          <div style={{ flex: 1 }} />
          <div style={{
            flex: 1,
            borderRight: isLeft ? '1px solid rgba(255,255,255,0.20)' : 'none',
            borderLeft: isLeft ? 'none' : '1px solid rgba(255,255,255,0.20)',
            borderTop: '1px solid rgba(255,255,255,0.20)',
            borderTopRightRadius: isLeft ? 4 : 0,
            borderTopLeftRadius: isLeft ? 0 : 4,
          }} />
          <div style={{
            flex: 1,
            borderRight: isLeft ? '1px solid rgba(255,255,255,0.20)' : 'none',
            borderLeft: isLeft ? 'none' : '1px solid rgba(255,255,255,0.20)',
            borderBottom: '1px solid rgba(255,255,255,0.20)',
            borderBottomRightRadius: isLeft ? 4 : 0,
            borderBottomLeftRadius: isLeft ? 0 : 4,
          }} />
          {/* spacer = 1/4 of connector height = center of bottom card */}
          <div style={{ flex: 1 }} />
        </div>
      ))}
    </div>
  )
}

function BracketColumn({ matches, side = 'left' }: { matches: KOMatch[]; side?: 'left' | 'right' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', alignSelf: 'stretch', flexShrink: 0 }}>
      {matches.map((match, i) => (
        <div key={match.id || i} style={{ display: 'flex', alignItems: 'center', flex: 1, justifyContent: 'center', padding: '4px 0' }}>
          <BracketMatchCard match={match} side={side} />
        </div>
      ))}
    </div>
  )
}

// ─── Mobile bracket components ───────────────────────────────────────────────
function MobileBracketCard({ match, isFinal = false }: { match: KOMatch; isFinal?: boolean }) {
  const isResolved = match.status === 'resolved'
  const homeWins   = isResolved && match.homeScore != null && match.awayScore != null && match.homeScore > match.awayScore
  const awayWins   = isResolved && match.homeScore != null && match.awayScore != null && match.awayScore > match.homeScore
  const isTBD      = match.homeName === 'TBD' && match.awayName === 'TBD'
  const homeFlag   = getFlagUrl(match.homeCode)
  const awayFlag   = getFlagUrl(match.awayCode)
  const ko         = match.deadline ? new Date(new Date(match.deadline).getTime() + 10 * 60000) : null
  const koValid    = ko && !isNaN(ko.getTime())

  return (
    <div style={{
      width: 150, borderRadius: 8, overflow: 'hidden', flexShrink: 0,
      border: `1px solid ${isFinal ? 'rgba(255,215,0,0.35)' : isResolved ? 'rgba(0,196,106,0.30)' : isTBD ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.12)'}`,
      background: isFinal ? 'rgba(255,215,0,0.05)' : isResolved ? 'rgba(0,196,106,0.06)' : isTBD ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)',
      opacity: isTBD ? 0.5 : 1,
    }}>
      {koValid && (
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', padding: '2px 8px', borderBottom: '0.5px solid rgba(255,255,255,0.07)' }}>
          {pyDateLabel(pyISODate(ko!))} · {pyTime(ko!)}
        </div>
      )}
      {([
        { name: match.homeName, flag: homeFlag, code: match.homeCode, score: match.homeScore, wins: homeWins },
        { name: match.awayName, flag: awayFlag, code: match.awayCode, score: match.awayScore, wins: awayWins },
      ] as const).map((team, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 5, padding: '7px 10px',
          borderTop: i > 0 ? '0.5px solid rgba(255,255,255,0.07)' : 'none',
          background: team.wins ? 'rgba(0,196,106,0.07)' : 'transparent',
        }}>
          {team.flag && team.code
            ? <img src={team.flag} alt="" style={{ width: 18, height: 12, borderRadius: 2, objectFit: 'cover', flexShrink: 0 }} />
            : <div style={{ width: 18, height: 12, borderRadius: 2, background: 'rgba(255,255,255,0.1)', flexShrink: 0 }} />
          }
          <span style={{
            fontSize: 12, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            color: isTBD ? 'rgba(255,255,255,0.2)' : team.wins ? '#fff' : 'rgba(255,255,255,0.6)',
            fontWeight: team.wins ? 600 : 400,
            fontStyle: isTBD ? 'italic' : 'normal',
          }}>{team.name === 'TBD' ? '-' : team.name}</span>
          {isResolved && team.score != null && (
            <span style={{ fontSize: 12, fontWeight: 700, flexShrink: 0, color: team.wins ? '#00C46A' : 'rgba(255,255,255,0.3)' }}>
              {team.score}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

function MobileConnectors({ count }: { count: number }) {
  const CENTER = 35 // mitad de la altura aprox de MobileBracketCard (~70px)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignSelf: 'stretch', width: 16, flexShrink: 0 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, borderRight: '1px solid rgba(255,255,255,0.25)', borderTop: '1px solid rgba(255,255,255,0.25)', borderTopRightRadius: 4, marginTop: CENTER }} />
          <div style={{ flex: 1, borderRight: '1px solid rgba(255,255,255,0.25)', borderBottom: '1px solid rgba(255,255,255,0.25)', borderBottomRightRadius: 4, marginBottom: CENTER }} />
        </div>
      ))}
    </div>
  )
}

// ─── Matchday panel ───────────────────────────────────────────────────────────
interface Matchday {
  date: string
  preds: Prediction[]
}

function MatchdayPanel({
  matchdays,
  idx,
  onPrev,
  onNext,
}: {
  matchdays: Matchday[]
  idx: number
  onPrev: () => void
  onNext: () => void
}) {
  if (matchdays.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.30)' }}>Partidos próximamente</p>
      </div>
    )
  }

  const day = matchdays[idx]
  const dateLabel = pyDateLabel(day.date)

  return (
    <div>
      {/* Matchday nav */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={onPrev}
          disabled={idx === 0}
          style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: idx === 0 ? 'not-allowed' : 'pointer', opacity: idx === 0 ? 0.4 : 1 }}
        >
          <ChevronLeft className="h-4 w-4" style={{ color: '#fff' }} />
        </button>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.70)' }}>
          Día {idx + 1}
        </span>
        <button
          onClick={onNext}
          disabled={idx === matchdays.length - 1}
          style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: idx === matchdays.length - 1 ? 'not-allowed' : 'pointer', opacity: idx === matchdays.length - 1 ? 0.4 : 1 }}
        >
          <ChevronRight className="h-4 w-4" style={{ color: '#fff' }} />
        </button>
      </div>

      {/* Date label */}
      <p className="text-xs font-semibold mb-2 capitalize" style={{ color: 'rgba(255,255,255,0.40)' }}>
        {dateLabel}
      </p>

      {/* Matches */}
      <div className="space-y-1.5">
        {day.preds.map(p => {
          const opts = Array.isArray(p.options) ? (p.options as string[]) : []
          const ko = p.deadline ? new Date(new Date(p.deadline).getTime() + 10 * 60 * 1000) : null
          const timeStr = ko && !isNaN(ko.getTime()) ? pyTime(ko) : '--:--'
          const homeName = getTeamNameES(opts[0] ?? p.home_team_code ?? '')
          const awayName = getTeamNameES(opts[2] ?? p.away_team_code ?? '')

          const isResolved = p.status === 'resolved' && !!p.correct_answer
          const ca = (p.correct_answer ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
          const h  = (opts[0] ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
          const a  = (opts[2] ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
          const homeWon = isResolved && ca === h && h !== ''
          const awayWon = isResolved && ca === a && a !== ''
          const isDraw  = isResolved && !homeWon && !awayWon

          return (
            <div
              key={p.id}
              className="flex items-center gap-2 px-3 py-2 rounded-lg"
              style={{
                background: isResolved ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${isResolved ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.07)'}`,
              }}
            >
              <Flag tla={p.home_team_code} w={18} h={12} />
              <span style={{
                fontSize: 11, flex: 1,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                color: homeWon ? '#22c55e' : awayWon ? 'rgba(255,255,255,0.35)' : '#fff',
                fontWeight: homeWon ? 700 : 400,
              }}>
                {homeName || '?'}
              </span>

              {isResolved ? (
                <span style={{ fontSize: 10, fontWeight: 800, flexShrink: 0, letterSpacing: '0.04em',
                  color: isDraw ? '#f59e0b' : '#22c55e' }}>
                  {homeWon ? 'G · P' : isDraw ? 'E · E' : 'P · G'}
                </span>
              ) : (
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)', fontWeight: 700, flexShrink: 0 }}>
                  {timeStr}
                </span>
              )}

              <span style={{
                fontSize: 11, flex: 1, textAlign: 'right',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                color: awayWon ? '#22c55e' : homeWon ? 'rgba(255,255,255,0.35)' : '#fff',
                fontWeight: awayWon ? 700 : 400,
              }}>
                {awayName || '?'}
              </span>
              <Flag tla={p.away_team_code} w={18} h={12} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function CalendarioView({
  predictions,
  wcStandings,
}: {
  predictions: Prediction[]
  wcStandings: StandingsByType | null
}) {
  const [calTab,        setCalTab]        = useState<CalTab>('resumen')
  const [dayIdx,        setDayIdx]        = useState(0)
  const bracketRef       = useRef<HTMLDivElement>(null)
  const mobileBracketRef = useRef<HTMLDivElement>(null)
  const mobileR32Ref     = useRef<HTMLDivElement>(null)
  const mobileR16Ref     = useRef<HTMLDivElement>(null)
  const mobileQfRef      = useRef<HTMLDivElement>(null)
  const mobileSfRef      = useRef<HTMLDivElement>(null)
  const mobileFinRef     = useRef<HTMLDivElement>(null)
  const [mobilePhase, setMobilePhase] = useState('LAST_32')

  const MOBILE_PHASES = [
    { key: 'LAST_32',        label: '32AVOS',  dates: '28 JUN'    },
    { key: 'LAST_16',        label: 'OCTAVOS', dates: '4-7 JUL'   },
    { key: 'QUARTER_FINALS', label: 'CUARTOS', dates: '9-12 JUL'  },
    { key: 'SEMI_FINALS',    label: 'SEMIS',   dates: '14-15 JUL' },
    { key: 'FINAL',          label: 'FINAL',   dates: '19 JUL'    },
  ]

  function scrollToMobilePhase(phase: string) {
    const refs: Record<string, React.RefObject<HTMLDivElement | null>> = {
      LAST_32: mobileR32Ref, LAST_16: mobileR16Ref,
      QUARTER_FINALS: mobileQfRef, SEMI_FINALS: mobileSfRef, FINAL: mobileFinRef,
    }
    const section   = refs[phase]?.current
    const container = mobileBracketRef.current
    if (section && container) container.scrollTo({ left: section.offsetLeft - 8, behavior: 'smooth' })
    setMobilePhase(phase)
  }

  useEffect(() => {
    const el = bracketRef.current
    if (!el) return
    let isDown = false, startX = 0, scrollLeft = 0
    const onDown = (e: MouseEvent) => { isDown = true; startX = e.pageX - el.offsetLeft; scrollLeft = el.scrollLeft; el.style.cursor = 'grabbing' }
    const onUp   = () => { isDown = false; el.style.cursor = 'grab' }
    const onMove = (e: MouseEvent) => {
      if (!isDown) return
      e.preventDefault()
      el.scrollLeft = scrollLeft - (e.pageX - el.offsetLeft - startX) * 1.5
    }
    el.addEventListener('mousedown', onDown)
    el.addEventListener('mouseup',   onUp)
    el.addEventListener('mouseleave', onUp)
    el.addEventListener('mousemove', onMove, { passive: false })
    return () => {
      el.removeEventListener('mousedown', onDown)
      el.removeEventListener('mouseup',   onUp)
      el.removeEventListener('mouseleave', onUp)
      el.removeEventListener('mousemove', onMove)
    }
  }, [])

  useEffect(() => {
    const container = mobileBracketRef.current
    if (!container) return
    const phases = ['FINAL', 'SEMI_FINALS', 'QUARTER_FINALS', 'LAST_16', 'LAST_32']
    const refs   = [mobileFinRef, mobileSfRef, mobileQfRef, mobileR16Ref, mobileR32Ref]
    const handleScroll = () => {
      const sl = container.scrollLeft
      for (let i = 0; i < refs.length; i++) {
        const el = refs[i].current
        if (el && el.offsetLeft <= sl + 60) { setMobilePhase(phases[i]); return }
      }
    }
    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const el = mobileBracketRef.current
    if (!el) return
    let down = false, sx = 0, sl = 0
    const md = (e: MouseEvent | TouchEvent) => {
      down = true
      sx = (e instanceof TouchEvent ? e.touches[0].pageX : e.pageX)
      sl = el.scrollLeft
      if (!(e instanceof TouchEvent)) el.style.cursor = 'grabbing'
    }
    const mu = () => { down = false; el.style.cursor = 'grab' }
    const mm = (e: MouseEvent | TouchEvent) => {
      if (!down) return
      const x = (e instanceof TouchEvent ? e.touches[0].pageX : e.pageX)
      el.scrollLeft = sl - (x - sx)
    }
    el.addEventListener('mousedown',  md as EventListener)
    el.addEventListener('mouseup',    mu)
    el.addEventListener('mouseleave', mu)
    el.addEventListener('mousemove',  mm as EventListener)
    el.addEventListener('touchstart', md as EventListener, { passive: true })
    el.addEventListener('touchend',   mu)
    el.addEventListener('touchmove',  mm as EventListener, { passive: true })
    return () => {
      el.removeEventListener('mousedown',  md as EventListener)
      el.removeEventListener('mouseup',    mu)
      el.removeEventListener('mouseleave', mu)
      el.removeEventListener('mousemove',  mm as EventListener)
      el.removeEventListener('touchstart', md as EventListener)
      el.removeEventListener('touchend',   mu)
      el.removeEventListener('touchmove',  mm as EventListener)
    }
  }, [])

  const wcStart = useMemo(() => {
    const first = predictions
      .filter(p => p.home_team_code && p.away_team_code && p.deadline)
      .map(p => new Date(p.deadline!))
      .filter(d => !isNaN(d.getTime()))
      .sort((a, b) => a.getTime() - b.getTime())[0]
    // fallback deadline = 10 min before expected 20:00 UTC kickoff (16:00 PY)
    return first ?? new Date('2026-06-11T19:50:00Z')
  }, [predictions])

  // kickoff = deadline + 10 min (predictions close 10 min before the match)
  const kickoffTime = useMemo(() => new Date(wcStart.getTime() + 10 * 60 * 1000), [wcStart])

  const mxHora = useMemo(() =>
    kickoffTime.toLocaleTimeString('es', {
      timeZone: 'America/Mexico_City',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  , [kickoffTime])

  const countdown = useCountdown(wcStart)

  // Group predictions into matchdays (only match predictions)
  const matchdays = useMemo<Matchday[]>(() => {
    const byDate: Record<string, Prediction[]> = {}
    for (const p of predictions) {
      if (!p.home_team_code || !p.away_team_code || !p.deadline) continue
      const d = new Date(p.deadline)
      if (isNaN(d.getTime())) continue
      const key = pyISODate(d)
      if (!byDate[key]) byDate[key] = []
      byDate[key].push(p)
    }
    return Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, preds]) => ({ date, preds: preds.sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime()) }))
  }, [predictions])

  // Jump to first upcoming matchday on load
  useEffect(() => {
    if (matchdays.length === 0) return
    const today = pyISODate(new Date())
    const i = matchdays.findIndex(m => m.date >= today)
    setDayIdx(i === -1 ? matchdays.length - 1 : i)
  }, [matchdays])

  const activeGroups = useMemo(() => {
    if (!wcStandings) return []
    return wcStandings.total
      .map(s => ({ letter: s.group.replace('GROUP_', ''), table: s.table }))
      .sort((a, b) => a.letter.localeCompare(b.letter))
  }, [wcStandings])

  const CARD: React.CSSProperties = {
    background: 'var(--mundial-card-bg, rgba(255,255,255,0.04))',
    border: '1px solid var(--mundial-card-border, rgba(255,255,255,0.08))',
    borderRadius: 14,
  }

  // Derived from countdown (null = not yet computed on client = treat as not started)
  const isStarted = countdown != null && countdown.days === 0 && countdown.hours === 0 && countdown.minutes === 0 && countdown.seconds === 0

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-montserrat, system-ui)', margin: 0, marginBottom: 4, letterSpacing: '-0.01em' }}>
          Copa del Mundo
        </h1>
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.10em', color: 'rgba(255,255,255,0.35)', margin: 0, textTransform: 'uppercase' }}>
          FIFA World Cup 2026 · Internacional
        </p>
      </div>

      {/* ── Sub-tabs ────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 mb-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 0 }}>
        {(['resumen', 'clasificacion', 'eliminatoria'] as CalTab[]).map(t => {
          const labels: Record<CalTab, string> = {
            resumen: 'Resumen',
            clasificacion: 'Clasificación',
            eliminatoria: 'Eliminatoria',
          }
          const active = calTab === t
          return (
            <button
              key={t}
              onClick={() => setCalTab(t)}
              className="px-4 py-2.5 text-sm font-bold"
              style={{
                background: 'none',
                border: 'none',
                borderBottom: active ? '2px solid #22c55e' : '2px solid transparent',
                cursor: 'pointer',
                color: active ? '#22c55e' : 'rgba(255,255,255,0.45)',
                marginBottom: -1,
                transition: 'color 0.15s',
              }}
            >
              {labels[t]}
            </button>
          )
        })}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: RESUMEN
      ══════════════════════════════════════════════════════════════════════ */}
      {calTab === 'resumen' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: groups 2-col grid */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activeGroups.map(({ letter, table }) => (
                <CompactGroupTable key={letter} letter={letter} table={table} />
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-3 px-1">
              <div className="flex items-center gap-1.5">
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e' }} />
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>Clasifican a Octavos</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }} />
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>Posible repechaje</span>
              </div>
            </div>
          </div>

          {/* Right: countdown + matchday */}
          <div className="lg:col-span-2 space-y-4">
            {/* Countdown */}
            <div style={{ ...CARD, padding: '20px 16px', textAlign: 'center' }}>
              <img src="/logo-mundial.png" alt="WC 2026" style={{ width: 44, height: 44, objectFit: 'contain', margin: '0 auto 8px' }} />
              <p className="text-xs font-black tracking-widest mb-4" style={{ color: 'rgba(255,255,255,0.40)' }}>
                {isStarted ? 'EN CURSO' : 'INICIO DEL MUNDIAL'}
              </p>
              {!isStarted ? (
                <div className="flex justify-center gap-3">
                  {([
                    { v: countdown?.days,    l: 'DÍAS' },
                    { v: countdown?.hours,   l: 'HRS' },
                    { v: countdown?.minutes, l: 'MIN' },
                    { v: countdown?.seconds, l: 'SEG' },
                  ] as { v: number | undefined; l: string }[]).map(({ v, l }) => (
                    <div key={l} className="flex flex-col items-center">
                      <div
                        className="flex items-center justify-center rounded-lg font-black tabular-nums"
                        style={{ width: 52, height: 52, background: 'rgba(0,106,51,0.20)', border: '1px solid rgba(0,106,51,0.30)', fontSize: 22, color: '#fff' }}
                      >
                        {v == null ? '--' : String(v).padStart(2, '0')}
                      </div>
                      <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.30)', marginTop: 4, fontWeight: 700, letterSpacing: '0.08em' }}>{l}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: 13, color: '#22c55e', fontWeight: 700 }}>¡El Mundial está en juego!</p>
              )}
              <p className="mt-3" style={{ fontSize: 13, color: 'rgba(255,255,255,0.50)', fontWeight: 600 }}>
                {pyDateTimeMed(kickoffTime)} PY
              </p>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>
                {mxHora} CDT · Ciudad de México
              </p>
            </div>

            {/* Matchday panel */}
            <div style={{ ...CARD, padding: '16px' }}>
              <p className="text-xs font-black tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.40)' }}>PARTIDOS</p>
              <MatchdayPanel
                matchdays={matchdays}
                idx={dayIdx}
                onPrev={() => setDayIdx(i => Math.max(0, i - 1))}
                onNext={() => setDayIdx(i => Math.min(matchdays.length - 1, i + 1))}
              />
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: CLASIFICACIÓN
      ══════════════════════════════════════════════════════════════════════ */}
      {calTab === 'clasificacion' && (
        <div>
          {/* Legend */}
          <div className="flex items-center gap-4 mb-4 px-1">
            <div className="flex items-center gap-1.5">
              <div style={{ width: 3, height: 16, background: '#22c55e', borderRadius: 2 }} />
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)' }}>Clasificados a Octavos</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div style={{ width: 3, height: 16, background: '#f59e0b', borderRadius: 2 }} />
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)' }}>Posible repechaje (3°)</span>
            </div>
          </div>

          {/* All groups */}
          <div className="space-y-4">
            {activeGroups.map(({ letter, table }) => (
              <FullGroupTable key={letter} letter={letter} table={table} />
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: ELIMINATORIA
      ══════════════════════════════════════════════════════════════════════ */}
      {calTab === 'eliminatoria' && (
        <div>
          <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Los cruces definitivos se confirman al final de la fase de grupos.
          </p>

          {(() => {
            const toPred = (p: Prediction): KOMatch => {
              const opts = Array.isArray(p.options) ? (p.options as string[]) : []
              const h = getTeamNameES(opts[0] ?? '')
              const a = getTeamNameES(opts[opts.length - 1] ?? '')
              return {
                id:        p.id,
                homeName:  (h === 'Por definir' || !h) ? 'TBD' : h,
                awayName:  (a === 'Por definir' || !a) ? 'TBD' : a,
                homeCode:  p.home_team_code,
                awayCode:  p.away_team_code,
                homeScore: p.exact_score_home ?? null,
                awayScore: p.exact_score_away ?? null,
                status:    p.status,
                deadline:  p.deadline ?? null,
              }
            }
            const byStage: Record<string, KOMatch[]> = {}
            for (const s of ['LAST_32', 'LAST_16', 'QUARTER_FINALS', 'SEMI_FINALS', 'FINAL', 'THIRD_PLACE']) {
              byStage[s] = predictions
                .filter(p => (p.stage ?? '') === s && p.home_team_code && p.away_team_code)
                .sort((a, b) => new Date(a.deadline ?? 0).getTime() - new Date(b.deadline ?? 0).getTime())
                .map(toPred)
            }
            const last32Left  = byStage.LAST_32.slice(0, 8)
            const last32Right = byStage.LAST_32.slice(8, 16)
            const last16Left  = byStage.LAST_16.slice(0, 4)
            const last16Right = byStage.LAST_16.slice(4, 8)
            const qfLeft      = byStage.QUARTER_FINALS.slice(0, 2)
            const qfRight     = byStage.QUARTER_FINALS.slice(2, 4)
            const sfLeft      = byStage.SEMI_FINALS.slice(0, 1)
            const sfRight     = byStage.SEMI_FINALS.slice(1, 2)
            const finalMatch  = byStage.FINAL[0] ?? null
            const thirdPlace  = byStage.THIRD_PLACE[0] ?? null

            return (
              <>
                {/* ── MOBILE (md:hidden) ── */}
                <div className="md:hidden">
                  {/* Barra de fases */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3" style={{ scrollbarWidth: 'none' }}>
                    {MOBILE_PHASES.map((phase, i) => (
                      <div key={phase.key} className="flex items-center gap-1.5 flex-shrink-0">
                        {i > 0 && <div className="w-2 h-px bg-white/15 flex-shrink-0" />}
                        <button
                          onClick={() => scrollToMobilePhase(phase.key)}
                          className={`flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-lg border flex-shrink-0 transition-all text-center ${
                            mobilePhase === phase.key
                              ? 'bg-[rgba(0,106,51,0.25)] border-[rgba(0,106,51,0.5)]'
                              : 'bg-white/[0.04] border-white/10'
                          }`}
                        >
                          <span className={`text-[10px] font-semibold tracking-wide ${mobilePhase === phase.key ? 'text-[#00C46A]' : 'text-gray-400'}`}>{phase.label}</span>
                          <span className="text-[8px] text-gray-600">{phase.dates}</span>
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Bracket scroll horizontal */}
                  <div ref={mobileBracketRef} className="overflow-x-auto cursor-grab select-none">
                    <div style={{ width: 'max-content' }}>

                      {/* Fila de títulos fuera de las columnas — sin impacto en altura de conectores */}
                      <div style={{ display: 'flex', paddingLeft: 8, paddingTop: 8, paddingBottom: 4 }}>
                        <div style={{ width: 150, textAlign: 'center', flexShrink: 0 }}>
                          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.30)', letterSpacing: '0.07em' }}>32AVOS</span>
                        </div>
                        <div style={{ width: 24, flexShrink: 0 }} />
                        <div style={{ width: 150, textAlign: 'center', flexShrink: 0 }}>
                          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.30)', letterSpacing: '0.07em' }}>OCTAVOS</span>
                        </div>
                        <div style={{ width: 24, flexShrink: 0 }} />
                        <div style={{ width: 150, textAlign: 'center', flexShrink: 0 }}>
                          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.30)', letterSpacing: '0.07em' }}>CUARTOS</span>
                        </div>
                        <div style={{ width: 24, flexShrink: 0 }} />
                        <div style={{ width: 150, textAlign: 'center', flexShrink: 0 }}>
                          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.30)', letterSpacing: '0.07em' }}>SEMIS</span>
                        </div>
                        <div style={{ width: 24, flexShrink: 0 }} />
                        <div style={{ width: 166, textAlign: 'center', flexShrink: 0 }}>
                          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.30)', letterSpacing: '0.07em' }}>FINAL</span>
                        </div>
                      </div>

                      {/* Columnas sin títulos internos */}
                      <div className="flex items-stretch px-2 pb-3" style={{ minHeight: 400 }}>

                        <div ref={mobileR32Ref} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', alignSelf: 'stretch', gap: 8, flexShrink: 0 }}>
                          {byStage.LAST_32.map((m, i) => <MobileBracketCard key={i} match={m} />)}
                        </div>

                        <MobileConnectors count={8} />
                        <div style={{ width: 8, height: 1, background: 'rgba(255,255,255,0.25)', alignSelf: 'center', flexShrink: 0 }} />

                        <div ref={mobileR16Ref} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', alignSelf: 'stretch', gap: 8, flexShrink: 0 }}>
                          {byStage.LAST_16.map((m, i) => <MobileBracketCard key={i} match={m} />)}
                        </div>

                        <MobileConnectors count={4} />
                        <div style={{ width: 8, height: 1, background: 'rgba(255,255,255,0.25)', alignSelf: 'center', flexShrink: 0 }} />

                        <div ref={mobileQfRef} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', alignSelf: 'stretch', gap: 8, flexShrink: 0 }}>
                          {byStage.QUARTER_FINALS.map((m, i) => <MobileBracketCard key={i} match={m} />)}
                        </div>

                        <MobileConnectors count={2} />
                        <div style={{ width: 8, height: 1, background: 'rgba(255,255,255,0.25)', alignSelf: 'center', flexShrink: 0 }} />

                        <div ref={mobileSfRef} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', alignSelf: 'stretch', gap: 8, flexShrink: 0 }}>
                          {byStage.SEMI_FINALS.map((m, i) => <MobileBracketCard key={i} match={m} />)}
                        </div>

                        <MobileConnectors count={1} />
                        <div style={{ width: 8, height: 1, background: 'rgba(255,255,255,0.25)', alignSelf: 'center', flexShrink: 0 }} />

                        <div ref={mobileFinRef} className="flex flex-col justify-center flex-shrink-0 px-2" style={{ gap: 10 }}>
                          {byStage.FINAL[0] && <MobileBracketCard match={byStage.FINAL[0]} isFinal />}
                          {byStage.THIRD_PLACE[0] && (
                            <>
                              <p className="text-[9px] text-gray-600 tracking-widest text-center mt-2">3° LUGAR</p>
                              <MobileBracketCard match={byStage.THIRD_PLACE[0]} />
                            </>
                          )}
                        </div>

                      </div>
                    </div>
                  </div>
                </div>

                {/* ── DESKTOP (hidden md:block) ── */}
                <div className="hidden md:block">
                  <div ref={bracketRef} style={{ overflowX: 'auto', overflowY: 'hidden', cursor: 'grab' }}>
                    <div style={{ display: 'flex', alignItems: 'stretch', minHeight: 700, padding: '16px 8px', width: 'max-content', margin: '0 auto' }}>

                      <BracketColumn matches={last32Left} side="left" />
                      <BracketConnectorGroup count={4} side="left" />
                      <BracketColumn matches={last16Left} side="left" />
                      <BracketConnectorGroup count={2} side="left" />
                      <BracketColumn matches={qfLeft} side="left" />
                      <BracketConnectorGroup count={1} side="left" />
                      <BracketColumn matches={sfLeft} side="left" />
                      <div style={{ width: 16, alignSelf: 'center', borderTop: '1px solid rgba(255,255,255,0.20)', flexShrink: 0 }} />

                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, flexShrink: 0, padding: '4px 0' }}>
                        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.30)', letterSpacing: '0.08em' }}>FINAL</span>
                        <BracketMatchCard match={finalMatch} highlight />
                        {thirdPlace && (
                          <>
                            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.20)', letterSpacing: '0.08em', marginTop: 6 }}>3° LUGAR</span>
                            <BracketMatchCard match={thirdPlace} />
                          </>
                        )}
                      </div>

                      <div style={{ width: 16, alignSelf: 'center', borderTop: '1px solid rgba(255,255,255,0.20)', flexShrink: 0 }} />
                      <BracketColumn matches={sfRight} side="right" />
                      <BracketConnectorGroup count={1} side="right" />
                      <BracketColumn matches={qfRight} side="right" />
                      <BracketConnectorGroup count={2} side="right" />
                      <BracketColumn matches={last16Right} side="right" />
                      <BracketConnectorGroup count={4} side="right" />
                      <BracketColumn matches={last32Right} side="right" />

                    </div>
                  </div>
                </div>
              </>
            )
          })()}
        </div>
      )}
    </div>
  )
}
