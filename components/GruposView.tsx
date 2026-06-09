'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { getFlagUrl } from '@/lib/flagCodes'
import type { GroupStanding, GroupTeam } from '@/lib/grupos'

const GROUP_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']

function groupLetter(groupKey: string): string {
  return groupKey.replace('GROUP_', '')
}

function TeamRow({ team, index }: { team: GroupTeam; index: number }) {
  const qualified = team.position <= 2
  const flagUrl = getFlagUrl(team.team.tla)
  const dg = team.goalDifference

  return (
    <motion.tr
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.28, delay: index * 0.04 }}
      style={{
        borderBottom: '1px solid var(--mundial-header-border)',
        background: qualified ? 'rgba(34,197,94,0.05)' : 'transparent',
        borderLeft: qualified ? '3px solid #22c55e' : '3px solid transparent',
      }}
    >
      {/* Position */}
      <td className="py-3 pl-4 pr-3 text-right tabular-nums" style={{ width: 40 }}>
        <span
          className="text-sm font-bold"
          style={{ color: qualified ? '#22c55e' : 'var(--mundial-muted)' }}
        >
          {team.position}
        </span>
      </td>

      {/* Team */}
      <td className="py-3 pr-4" style={{ minWidth: 160 }}>
        <div className="flex items-center gap-2.5">
          {flagUrl ? (
            <img
              src={flagUrl}
              alt={team.team.tla}
              className="rounded-sm shrink-0"
              style={{ width: 28, height: 20, objectFit: 'cover' }}
            />
          ) : (
            <div
              className="shrink-0 rounded-sm"
              style={{ width: 28, height: 20, background: 'var(--mundial-flag-bg)' }}
            >
            </div>
          )}
          <span
            className="text-sm font-semibold truncate"
            style={{ color: 'var(--mundial-team-name)', maxWidth: 120 }}
          >
            {team.team.shortName || team.team.name}
          </span>
        </div>
      </td>

      {/* Stats */}
      {([
        team.playedGames,
        team.won,
        team.draw,
        team.lost,
        team.goalsFor,
        team.goalsAgainst,
      ] as number[]).map((val, i) => (
        <td
          key={i}
          className="py-3 px-2 text-right tabular-nums text-sm"
          style={{ color: 'var(--mundial-info)', width: 36 }}
        >
          {val}
        </td>
      ))}

      {/* Goal difference */}
      <td className="py-3 px-2 text-right tabular-nums text-sm" style={{ width: 40 }}>
        <span style={{ color: dg > 0 ? '#22c55e' : dg < 0 ? '#f87171' : 'var(--mundial-info)' }}>
          {dg > 0 ? `+${dg}` : dg}
        </span>
      </td>

      {/* Points */}
      <td className="py-3 pl-2 pr-4 text-right tabular-nums" style={{ width: 44 }}>
        <span className="stat-number text-sm font-black" style={{ color: 'var(--secondary)' }}>
          {team.points}
        </span>
      </td>
    </motion.tr>
  )
}

export default function GruposView({ groups, isMock }: { groups: GroupStanding[]; isMock: boolean }) {
  const availableLetters = groups.map(g => groupLetter(g.group)).filter(l => GROUP_LETTERS.includes(l))
  const defaultLetter = availableLetters[0] ?? 'A'
  const [activeGroup, setActiveGroup] = useState(defaultLetter)

  const tabLetters = availableLetters.length > 0 ? availableLetters : GROUP_LETTERS

  const currentGroup = groups.find(g => groupLetter(g.group) === activeGroup)

  return (
    <div>
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="text-center mb-8"
      >
        <div className="flex items-center justify-center gap-4 mb-3">
          <div>
            <h1
              className="text-3xl font-black"
              style={{
                color: '#fff',
                letterSpacing: '-0.02em',
              }}
            >
              TABLA DE GRUPOS
            </h1>
            <p className="text-xs mt-0.5 tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>
              MUNDIAL 2026 · USA · CANADA · MEXICO
            </p>
          </div>
        </div>

        <div
          className="mx-auto mb-4"
          style={{
            width: 80,
            height: 1,
            background: 'rgba(0,82,165,0.45)',
          }}
        />

        {/* Legend + mock badge */}
        <div className="flex items-center justify-center gap-4 flex-wrap text-xs" style={{ color: 'rgba(255,255,255,0.40)' }}>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-3 rounded-sm" style={{ background: '#22c55e' }} />
            Clasificados a octavos
          </span>
          {isMock && (
            <span
              className="px-2 py-0.5 rounded-full font-medium"
              style={{
                background: 'rgba(99,102,241,0.12)',
                border: '1px solid rgba(99,102,241,0.25)',
                color: '#a78bfa',
              }}
            >
              Datos de prueba
            </span>
          )}
        </div>
      </motion.div>

      {/* Group tabs */}
      <div className="flex gap-2 mb-6 flex-wrap" style={{ scrollbarWidth: 'none' }}>
        {tabLetters.map(letter => {
          const isActive = activeGroup === letter
          return (
            <button
              key={letter}
              onClick={() => setActiveGroup(letter)}
              className="py-1.5 px-4 text-sm font-semibold"
              style={{
                background: isActive ? '#006A33' : 'transparent',
                color: isActive ? '#fff' : 'rgba(255,255,255,0.50)',
                border: isActive ? '1px solid #006A33' : '1px solid rgba(255,255,255,0.15)',
                borderRadius: '9999px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: isActive ? '0 2px 12px rgba(0,106,51,0.35)' : 'none',
                letterSpacing: '0.06em',
              }}
            >
              {letter}
            </button>
          )
        })}
      </div>

      {/* Table */}
      <motion.div
        key={activeGroup}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
        className="card rounded-2xl overflow-hidden"
      >
        {/* Group header */}
        <div
          className="px-4 py-3 flex items-center gap-3"
          style={{
            background: 'var(--mundial-header-bg)',
            borderBottom: '1px solid var(--mundial-header-border)',
          }}
        >
          <span className="text-sm font-black" style={{ color: 'var(--secondary)', letterSpacing: '0.08em' }}>
            GRUPO {activeGroup}
          </span>
          {currentGroup && (
            <span className="text-xs" style={{ color: 'var(--mundial-muted)' }}>
              {currentGroup.table[0]?.playedGames > 0
                ? `${currentGroup.table.reduce((acc, t) => acc + t.playedGames, 0) / 2} partidos jugados`
                : 'Sin partidos jugados'}
            </span>
          )}
        </div>

        {!currentGroup || currentGroup.table.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--mundial-info)' }}>
              Datos no disponibles para el Grupo {activeGroup}
            </p>
            <p className="text-xs" style={{ color: 'var(--mundial-muted)' }}>
              La fase de grupos aún no comenzó
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full" style={{ minWidth: 480 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--mundial-header-border)' }}>
                  <th className="py-2.5 pl-4 pr-3 text-right text-xs font-semibold tracking-wider" style={{ color: 'var(--mundial-muted)', width: 40 }}>
                    Pos
                  </th>
                  <th className="py-2.5 pr-4 text-left text-xs font-semibold tracking-wider" style={{ color: 'var(--mundial-muted)', minWidth: 160 }}>
                    Equipo
                  </th>
                  {['PJ', 'G', 'E', 'P', 'GF', 'GC'].map(h => (
                    <th key={h} className="py-2.5 px-2 text-right text-xs font-semibold tracking-wider" style={{ color: 'var(--mundial-muted)', width: 36 }}>
                      {h}
                    </th>
                  ))}
                  <th className="py-2.5 px-2 text-right text-xs font-semibold tracking-wider" style={{ color: 'var(--mundial-muted)', width: 40 }}>
                    DG
                  </th>
                  <th className="py-2.5 pl-2 pr-4 text-right text-xs font-semibold tracking-wider" style={{ color: 'var(--secondary)', width: 44 }}>
                    Pts
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentGroup.table.map((team, i) => (
                  <TeamRow key={team.team.tla || i} team={team} index={i} />
                ))}
              </tbody>
            </table>

            {/* Qualification legend */}
            <div
              className="px-4 py-3 flex items-center gap-4 text-xs"
              style={{
                borderTop: '1px solid var(--mundial-header-border)',
                color: 'var(--mundial-muted)',
              }}
            >
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-4 rounded-sm" style={{ background: '#22c55e' }} />
                Pasan a Octavos de Final
              </span>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}
