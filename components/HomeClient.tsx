'use client'

import { useState, useCallback, useMemo } from 'react'
import Image from 'next/image'
import { Trophy, Star, BookOpen, Home, Settings2, LogOut, Zap, Clock, Calendar, ClipboardList, Users } from 'lucide-react'
import AuthButton from '@/components/AuthButton'
import { createClient } from '@/lib/supabase/client'
import { savePrediction } from '@/app/actions/predictions'
import InicioView from '@/components/InicioView'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import PrediccionesTab from '@/components/PrediccionesTab'
import CalendarioView from '@/components/CalendarioView'
import type { Database } from '@/lib/database.types'

type Prediction = Database['public']['Tables']['predictions']['Row']
import RankingsTab from '@/components/RankingsTab'
import MisPrediccionesTab from '@/components/MisPrediccionesTab'
import EspecialesTab from '@/components/EspecialesTab'
import AdminTab from '@/components/AdminTab'
import MisGruposView, { type Group } from '@/components/MisGruposView'

function SidebarDecoration() {
  return (
    <svg viewBox="0 0 240 80" style={{ width: '100%', height: 80, display: 'block', flexShrink: 0 }} preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M-10,80 Q60,30 130,55 Q180,70 250,20 L250,80Z" fill="#006A33" opacity="0.7"/>
      <path d="M-10,80 Q50,50 110,65 Q160,78 250,40 L250,80Z" fill="#CE1126" opacity="0.6"/>
      <path d="M-10,80 Q40,60 100,72 Q150,82 250,55 L250,80Z" fill="#0052A5" opacity="0.7"/>
    </svg>
  )
}

type Tab = 'inicio' | 'mis-predicciones' | 'predicciones' | 'posiciones' | 'grupos' | 'especiales' | 'calendario' | 'admin' | 'reglas'

const NAV: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'inicio',             label: 'Inicio',            icon: <Home          size={18} strokeWidth={1.5} /> },
  { id: 'mis-predicciones',   label: 'Mis Predicciones',  icon: <ClipboardList size={18} strokeWidth={1.5} /> },
  { id: 'posiciones',         label: 'Rankings',          icon: <Trophy        size={18} strokeWidth={1.5} /> },
  { id: 'grupos',             label: 'Mis Grupos',        icon: <Users         size={18} strokeWidth={1.5} /> },
  { id: 'especiales',         label: 'Mis Especiales',    icon: <Star          size={18} strokeWidth={1.5} /> },
  { id: 'calendario',         label: 'Calendario',        icon: <Calendar      size={18} strokeWidth={1.5} /> },
  { id: 'reglas',             label: 'Reglas',            icon: <BookOpen      size={18} strokeWidth={1.5} /> },
]

const MOBILE_LABELS: Record<Tab, string> = {
  inicio:             'Inicio',
  'mis-predicciones': 'Mis Pred.',
  predicciones:       'Predic.',
  posiciones:         'Ranking',
  grupos:             'Grupos',
  especiales:         'Espec.',
  calendario:         'Calend.',
  reglas:             'Reglas',
  admin:              'Admin',
}

type RankEntry   = { id: string; username: string | null; avatar_url: string | null; total_points: number }
type MyStats     = { total: number; correct: number }
type GlobalStats = { totalUsers: number; totalPredictions: number; avgAccuracy: number }

interface Props {
  userId: string
  points: number
  username: string
  avatarUrl: string | null
  championTeam: string | null
  topScorer: string | null
  rank: number
  isAdmin: boolean
  predictions: Prediction[]
  existingAnswers: Record<string, string>
  existingScores: Record<string, { home: number; away: number }>
  rankings: RankEntry[]
  myStats: MyStats
  predCounts: Record<string, number>
  globalStats: GlobalStats
  voteDistributions: Record<string, Record<string, number>>
  initialGroups: Group[]
}

function ReglasTab() {
  const RULE_CARD: React.CSSProperties = {
    background: 'var(--mundial-card-bg)',
    border: '1px solid var(--mundial-card-border)',
    borderRadius: '1rem',
    overflow: 'hidden',
  }
  return (
    <div className="space-y-4">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-montserrat, system-ui)', margin: 0, marginBottom: 4, letterSpacing: '-0.01em' }}>
          Reglas
        </h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.40)', margin: 0 }}>
          Cómo ganar puntos
        </p>
      </div>

      <div style={RULE_CARD}>
        <div className="px-5 py-3" style={{ background: 'var(--mundial-header-bg)', borderBottom: '1px solid var(--mundial-header-border)' }}>
          <span className="flex items-center gap-2 text-sm font-black tracking-wider" style={{ color: '#60a5fa' }}><Zap className="h-4 w-4" /> PREDICCIONES DE PARTIDO</span>
        </div>
        <div className="px-5 py-4 space-y-3 text-sm" style={{ color: 'var(--text-primary)' }}>
          {[
            ['Resultado correcto (deducido del marcador)', '+3 pts'],
            ['Marcador exacto (incluye los +3)', '+8 pts'],
            ['Predicción incorrecta', '0 pts'],
          ].map(([rule, pts]) => (
            <div key={rule} className="flex items-center justify-between">
              <span style={{ color: 'rgba(255,255,255,0.60)' }}>{rule}</span>
              <span className="font-black text-xs" style={{ color: '#60a5fa' }}>{pts}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={RULE_CARD}>
        <div className="px-5 py-3" style={{ background: 'var(--mundial-header-bg)', borderBottom: '1px solid var(--mundial-header-border)' }}>
          <span className="flex items-center gap-2 text-sm font-black tracking-wider" style={{ color: 'var(--secondary)' }}><Trophy className="h-4 w-4" /> PREDICCIONES ESPECIALES</span>
        </div>
        <div className="px-5 py-4 space-y-3 text-sm">
          {[
            ['Campeón del Mundial', '+12 pts'],
            ['Goleador del torneo', '+12 pts'],
          ].map(([rule, pts]) => (
            <div key={rule} className="flex items-center justify-between">
              <span style={{ color: 'rgba(255,255,255,0.60)' }}>{rule}</span>
              <span className="font-black text-xs" style={{ color: 'var(--secondary)' }}>{pts}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={RULE_CARD}>
        <div className="px-5 py-3" style={{ background: 'var(--mundial-header-bg)', borderBottom: '1px solid var(--mundial-header-border)' }}>
          <span className="flex items-center gap-2 text-sm font-black tracking-wider" style={{ color: 'var(--warning)' }}><Clock className="h-4 w-4" /> PLAZOS</span>
        </div>
        <div className="px-5 py-4 text-sm" style={{ color: 'rgba(255,255,255,0.60)' }}>
          <p>Las predicciones cierran automáticamente al <strong style={{ color: 'var(--warning)' }}>inicio del partido</strong>. No podés cambiarlas después del cierre.</p>
        </div>
      </div>
    </div>
  )
}

export default function HomeClient({
  userId, points, username, avatarUrl, championTeam, topScorer, rank, isAdmin,
  predictions, existingAnswers, existingScores, rankings, myStats, predCounts, globalStats, voteDistributions, initialGroups,
}: Props) {
  console.log('[HomeClient] mounting — userId:', userId, 'predictions:', predictions.length)
  const [activeTab,    setActiveTab]    = useState<Tab>('inicio')
  const [imgError,     setImgError]     = useState(false)
  const [localAnswers, setLocalAnswers] = useState<Record<string, string>>({})
  const [localScores,  setLocalScores]  = useState<Record<string, { home: number; away: number }>>(() => ({ ...existingScores }))
  const [localVotes,   setLocalVotes]   = useState<Record<string, Record<string, number>>>(() => ({ ...voteDistributions }))
  const [predictError, setPredictError] = useState<string | null>(null)

  const mergedAnswers = useMemo(() => ({ ...existingAnswers, ...localAnswers }), [existingAnswers, localAnswers])
  const mergedScores  = useMemo(() => ({ ...existingScores,  ...localScores  }), [existingScores,  localScores])

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

  const handlePredict = useCallback(async (predictionId: string, answer: string, homeScore: number, awayScore: number) => {
    if (mergedAnswers[predictionId]) return
    setLocalAnswers(prev => ({ ...prev, [predictionId]: answer }))
    setLocalScores(prev  => ({ ...prev, [predictionId]: { home: homeScore, away: awayScore } }))
    setLocalVotes(prev => {
      const dist = { ...(prev[predictionId] ?? {}) }
      dist[answer] = (dist[answer] ?? 0) + 1
      return { ...prev, [predictionId]: dist }
    })
    try {
      const result = await savePrediction({ predictionId, answer, homeScore: homeScore ?? null, awayScore: awayScore ?? null })
      if (result.error) { revertPredict(predictionId, answer); showPredictError(result.error) }
    } catch {
      revertPredict(predictionId, answer)
      showPredictError('Error de conexión')
    }
  }, [mergedAnswers, revertPredict, showPredictError])

  const signOut = () => {
    createClient().auth.signOut()
    window.location.href = '/'
  }

  const firstName = username.split(' ')[0]

  return (
    <div
      className="flex flex-col md:flex-row"
      style={{ height: '100dvh', background: 'var(--page-bg-home)', overflow: 'hidden' }}
    >
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
      {/* ── Desktop sidebar ─────────────────────────────────────────────── */}
      <aside
        className="hidden md:flex flex-col w-60 shrink-0"
        style={{ background: '#07111F', borderRight: '1px solid rgba(255,255,255,0.06)', height: '100dvh' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <img src="/logo-mundial.png" alt="Mundial 2026" style={{ width: 40, height: 40, objectFit: 'contain' }} />
          <div>
            <h1
              className="text-base font-black leading-tight"
              style={{ fontFamily: 'var(--font-montserrat, system-ui)', color: '#fff', letterSpacing: '-0.01em' }}
            >
              TU MUNDIAL
            </h1>
            <p className="text-[10px] font-medium" style={{ color: 'rgba(255,255,255,0.35)', letterSpacing: '0.06em' }}>
              Tus Predicciones.
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-0.5 p-3 flex-1 overflow-y-auto">
          {NAV.map(item => {
            const isActive = item.id === activeTab
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-left w-full"
                style={{
                  background: isActive ? '#006A33' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
              >
                <span style={{ color: isActive ? '#fff' : 'rgba(255,255,255,0.40)', display: 'flex', alignItems: 'center' }}>
                  {item.icon}
                </span>
                <span className="text-sm font-semibold" style={{ color: isActive ? '#fff' : 'rgba(255,255,255,0.50)' }}>
                  {item.label}
                </span>
              </button>
            )
          })}

          {isAdmin && (() => {
            const isActive = activeTab === 'admin'
            return (
              <button
                onClick={() => setActiveTab('admin')}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-left w-full"
                style={{
                  background: isActive ? '#006A33' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
              >
                <span style={{ color: isActive ? '#fff' : 'rgba(255,255,255,0.40)', display: 'flex', alignItems: 'center' }}>
                  <Settings2 size={18} strokeWidth={1.5} />
                </span>
                <span className="text-sm font-semibold" style={{ color: isActive ? '#fff' : 'rgba(255,255,255,0.50)' }}>
                  Admin
                </span>
              </button>
            )
          })()}
          <a
            href="/privacidad"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm"
            style={{ color: 'rgba(255,255,255,0.25)', textDecoration: 'none' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.50)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.25)')}
          >
            Privacidad
          </a>
        </nav>

        {/* User + sign-out */}
        <div className="shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3 px-4 py-3">
            {avatarUrl && !imgError ? (
              <Image
                src={avatarUrl} alt={firstName} width={40} height={40} unoptimized
                className="rounded-full object-cover shrink-0"
                style={{ border: '2px solid rgba(0,106,51,0.50)' }}
                onError={() => setImgError(true)}
              />
            ) : (
              <div
                className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-black text-white shrink-0"
                style={{ background: '#006A33' }}
              >
                {firstName[0]?.toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: '#fff' }}>{username}</p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                {points} pts &nbsp;·&nbsp; #{rank}
              </p>
            </div>
          </div>

          <button
            onClick={signOut}
            className="flex items-center gap-2.5 px-4 py-3 w-full"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              borderTop: '1px solid rgba(255,255,255,0.05)',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(206,17,38,0.08)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <LogOut className="h-4 w-4 shrink-0" style={{ color: '#f87171' }} />
            <span className="text-sm font-medium" style={{ color: '#f87171' }}>Cerrar sesión</span>
          </button>
        </div>

        <SidebarDecoration />
      </aside>

      {/* ── Mobile header ────────────────────────────────────────────────── */}
      <div
        className="md:hidden shrink-0"
        style={{ background: 'var(--navy, #0B132B)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex flex-col">
            <span
              className="text-sm font-black leading-tight"
              style={{ fontFamily: 'var(--font-montserrat, system-ui)', color: '#fff' }}
            >
              TU MUNDIAL
            </span>
            <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)', letterSpacing: '0.04em' }}>
              Tus Predicciones
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs">
              <span style={{ color: 'rgba(255,255,255,0.60)' }}>{points} pts</span>
              <span style={{ color: 'rgba(255,255,255,0.60)' }}>#{rank}</span>
            </div>
            <AuthButton />
          </div>
        </div>

        {/* Tab strip */}
        <div className="flex gap-1 px-3 pb-3">
          {NAV.map(item => {
            const isActive = item.id === activeTab
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className="flex-1 flex flex-col items-center py-2 rounded-lg gap-1"
                style={{
                  background: isActive ? '#006A33' : 'rgba(255,255,255,0.06)',
                  color: isActive ? '#fff' : 'rgba(255,255,255,0.40)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background 0.15s, color 0.15s',
                  boxShadow: isActive ? '0 2px 8px rgba(0,82,165,0.40)' : 'none',
                }}
              >
                {item.icon}
                <span className="text-[9px] font-bold leading-none" style={{ letterSpacing: '0.02em' }}>
                  {MOBILE_LABELS[item.id]}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Content area ─────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto" style={{ background: 'var(--page-bg-home)' }}>
        <div
          key={activeTab}
          className="animate-slide-up"
          style={{
            maxWidth: activeTab === 'inicio' ? 1200 : activeTab === 'calendario' ? 1200 : 1200,
            margin: '0 auto',
            padding: '32px 16px',
          }}
        >
          
          {activeTab === 'inicio' && (
            <ErrorBoundary>
              <InicioView
                userId={userId}
                points={points}
                rank={rank}
                predictions={predictions}
                existingAnswers={mergedAnswers}
                existingScores={mergedScores}
                voteDistributions={localVotes}
                onPredict={handlePredict}
                onGoToMisPredicciones={() => setActiveTab('mis-predicciones')}
                onCalendarioClick={() => setActiveTab('calendario')}
              />
            </ErrorBoundary>
          )}
          {activeTab === 'mis-predicciones' && (
            <MisPrediccionesTab
              predictions={predictions}
              existingAnswers={mergedAnswers}
              existingScores={mergedScores}
            />
          )}
          {activeTab === 'predicciones' && (
            <PrediccionesTab
              userId={userId}
              predictions={predictions}
              existingAnswers={mergedAnswers}
              voteDistributions={localVotes}
            />
          )}
          {activeTab === 'posiciones'   && (
            <RankingsTab
              currentUserId={userId}
              rankings={rankings}
              myStats={myStats}
              predCounts={predCounts}
              globalStats={globalStats}
            />
          )}
          {activeTab === 'grupos' && (
            <MisGruposView userId={userId} initialGroups={initialGroups} />
          )}
          {activeTab === 'especiales'   && (
            <EspecialesTab userId={userId} championTeam={championTeam} topScorer={topScorer} />
          )}
          {activeTab === 'calendario' && (
            <ErrorBoundary>
              <CalendarioView predictions={predictions} />
            </ErrorBoundary>
          )}
          {activeTab === 'admin'  && isAdmin && <AdminTab />}
          {activeTab === 'reglas' && <ReglasTab />}
        </div>
      </main>
    </div>
  )
}
