'use client'

import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import GruposView from '@/components/GruposView'
import type { GroupStanding } from '@/lib/grupos'

export default function GruposTab() {
  const [groups,  setGroups]  = useState<GroupStanding[]>([])
  const [isMock,  setIsMock]  = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/grupos')
      .then(r => r.json())
      .then(({ groups, isMock }) => { setGroups(groups); setIsMock(isMock) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20" style={{ color: 'var(--mundial-muted)' }}>
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  return <GruposView groups={groups} isMock={isMock} />
}
