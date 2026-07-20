'use client'
import { createContext, useContext, useState, useEffect } from 'react'

export interface Tournament {
  id: string
  name: string
  slug: string
  status: 'upcoming' | 'active' | 'finished'
  logo_url?: string | null
  competition_id?: number | null
  start_date?: string | null
  end_date?: string | null
}

interface TournamentContextValue {
  activeTournament: Tournament | null
  tournaments: Tournament[]
  setActiveTournament: (t: Tournament) => void
}

const TournamentContext = createContext<TournamentContextValue>({
  activeTournament: null,
  tournaments: [],
  setActiveTournament: () => {},
})

export function TournamentProvider({ children }: { children: React.ReactNode }) {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [activeTournament, setActiveTournament] = useState<Tournament | null>(null)

  useEffect(() => {
    const load = async () => {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data } = await supabase
        .from('tournaments')
        .select('*')
        .order('start_date', { ascending: false })

      if (data?.length) {
        setTournaments(data as Tournament[])
        const active = (data as Tournament[]).find(t => t.status === 'active') ?? (data as Tournament[])[0]
        setActiveTournament(active)
      }
    }
    load()
  }, [])

  return (
    <TournamentContext.Provider value={{ activeTournament, tournaments, setActiveTournament }}>
      {children}
    </TournamentContext.Provider>
  )
}

export const useTournament = () => useContext(TournamentContext)
