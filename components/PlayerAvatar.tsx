'use client'

import { useState } from 'react'
import { PLAYER_COLORS } from '@/lib/strikers'

function initials(name: string) {
  const parts = name.split(' ')
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase()
}

interface Props {
  name:   string
  code:   string
  photo?: string | null
  size?:  number
}

export default function PlayerAvatar({ name, code, photo, size = 40 }: Props) {
  const [photoFailed, setPhotoFailed] = useState(false)
  const bg = PLAYER_COLORS[code] ?? '#334155'

  const showPhoto = photo && !photoFailed

  return (
    <div
      className="flex items-center justify-center shrink-0 rounded-full overflow-hidden font-bold"
      style={{ width: size, height: size, background: showPhoto ? 'transparent' : bg, fontSize: Math.round(size * 0.325), color: '#fff', letterSpacing: '-0.01em' }}
    >
      {showPhoto ? (
        <img
          src={photo}
          alt={name}
          onError={() => setPhotoFailed(true)}
          style={{ width: size, height: size, objectFit: 'cover' }}
        />
      ) : (
        initials(name)
      )}
    </div>
  )
}
