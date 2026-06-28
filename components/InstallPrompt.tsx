'use client'

import { useState, useEffect } from 'react'
import { Smartphone, Bell, Check, Share } from 'lucide-react'

const STORAGE_KEY = 'tu-mundial-install-prompt-shown'

const STEPS_IOS = [
  { num: 1, text: <span key="1">Tocá el ícono <strong style={{ color: '#fff' }}>Compartir</strong> <Share size={11} style={{ display: 'inline', verticalAlign: 'middle' }} /> en la barra del navegador</span> },
  { num: 2, text: <span key="2">Elegí <strong style={{ color: '#fff' }}>Agregar a inicio</strong></span> },
  { num: 3, text: <span key="3">Tocá <strong style={{ color: '#fff' }}>Agregar</strong> para confirmar</span> },
]

const STEPS_ANDROID = [
  { num: 1, text: <span key="1">Tocá el menú <strong style={{ color: '#fff' }}>⋮</strong> del navegador</span> },
  { num: 2, text: <span key="2">Elegí <strong style={{ color: '#fff' }}>Instalar app</strong> o <strong style={{ color: '#fff' }}>Agregar a inicio</strong></span> },
  { num: 3, text: <span key="3">Tocá <strong style={{ color: '#fff' }}>Instalar</strong> para confirmar</span> },
]

const STEPS_NOTIFICATIONS = [
  { num: 1, text: <span key="1">Recibí alertas cuando <strong style={{ color: '#fff' }}>empiecen tus partidos</strong></span> },
  { num: 2, text: <span key="2">Te avisamos antes de que <strong style={{ color: '#fff' }}>cierre el plazo</strong> de predicción</span> },
  { num: 3, text: <span key="3">Enterate de los <strong style={{ color: '#fff' }}>resultados</strong> al instante</span> },
]

interface Props {
  onDismiss: () => void
}

export default function InstallPrompt({ onDismiss }: Props) {
  const [isIOS,    setIsIOS]    = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [step,     setStep]     = useState<number>(0) // set after detection

  useEffect(() => {
    const ua = navigator.userAgent || ''
    const ios     = /iPhone|iPad|iPod/.test(ua)
    const android = /Android/.test(ua)
    const mobile  = ios || android
    setIsIOS(ios)
    setIsMobile(mobile)
    setStep(mobile ? 0 : 1)
  }, [])

  const totalSteps = isMobile ? 3 : 2

  const handleNotifications = async () => {
    try {
      if (typeof Notification !== 'undefined' && Notification.permission !== 'denied') {
        await Notification.requestPermission()
      }
    } catch { /* silenciar */ }
    setStep(isMobile ? 2 : 1)
  }

  const currentSteps =
    step === 0 ? (isIOS ? STEPS_IOS : STEPS_ANDROID)
    : step === 1 ? STEPS_NOTIFICATIONS
    : []

  const icon =
    step === 0 ? <Smartphone size={22} className="text-[#00C46A]" />
    : step === 1 ? <Bell size={22} className="text-[#00C46A]" />
    : <Check size={22} className="text-[#00C46A]" />

  const title =
    step === 0 ? 'Instalá la app'
    : step === 1 ? 'Activá notificaciones'
    : '¡Todo listo!'

  const subtitle =
    step === 0 ? 'Accedé más rápido desde tu pantalla de inicio'
    : step === 1 ? 'No te pierdas ningún partido ni predicción'
    : 'Ya estás configurado para disfrutar TU MUNDIAL'

  const mainLabel =
    step === 0 ? 'Entendido, voy a instalarlo'
    : step === 1 ? 'Activar notificaciones'
    : 'Empezar a predecir'

  const skipLabel =
    step === 0 ? 'Ahora no'
    : step === 1 ? 'Omitir'
    : null

  const handleMain = () => {
    if (step === 0) {
      setStep(1)
    } else if (step === 1) {
      handleNotifications()
    } else {
      onDismiss()
    }
  }

  const handleSkip = () => {
    if (step === 0) setStep(1)
    else if (step === 1) setStep(isMobile ? 2 : 1)
    else onDismiss()
  }

  const dotsTotal = isMobile ? 3 : 2
  const dotIdx    = isMobile ? step : step - 1

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center px-3 pb-3"
      style={{ background: 'rgba(5,13,36,0.75)' }}
      onClick={e => { if (e.target === e.currentTarget) onDismiss() }}
    >
      <div
        className="w-full max-w-sm overflow-hidden"
        style={{ background: '#0A1628', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 20 }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div style={{ width: 32, height: 3, background: 'rgba(255,255,255,0.15)', borderRadius: 99 }} />
        </div>

        <div className="p-5">
          {/* Step dots */}
          <div className="flex items-center gap-1.5 mb-5">
            {Array.from({ length: dotsTotal }).map((_, i) => (
              <div
                key={i}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width:      i === dotIdx ? 20 : 6,
                  background: i === dotIdx
                    ? '#00C46A'
                    : i < dotIdx
                    ? 'rgba(0,196,106,0.4)'
                    : 'rgba(255,255,255,0.15)',
                }}
              />
            ))}
          </div>

          {/* Icon */}
          <div
            className="flex items-center justify-center mb-4"
            style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(0,106,51,0.15)', border: '1px solid rgba(0,106,51,0.3)' }}
          >
            {icon}
          </div>

          {/* Title + subtitle */}
          <p className="text-base font-bold mb-1" style={{ color: '#fff' }}>{title}</p>
          <p className="text-[13px] mb-4" style={{ color: 'rgba(255,255,255,0.45)' }}>{subtitle}</p>

          {/* Step list */}
          {currentSteps.length > 0 && (
            <div className="flex flex-col gap-2 mb-5">
              {currentSteps.map(s => (
                <div
                  key={s.num}
                  className="flex items-center gap-3 rounded-xl"
                  style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <div
                    className="flex items-center justify-center flex-shrink-0 text-[11px] font-medium"
                    style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(0,106,51,0.2)', border: '1px solid rgba(0,106,51,0.4)', color: '#00C46A' }}
                  >
                    {s.num}
                  </div>
                  <span className="text-[13px]" style={{ color: 'rgba(255,255,255,0.70)' }}>{s.text}</span>
                </div>
              ))}
            </div>
          )}

          {/* Main button */}
          <button
            onClick={handleMain}
            className="w-full text-white text-sm font-medium rounded-xl flex items-center justify-center gap-2 mb-2 transition-opacity active:opacity-75"
            style={{ padding: '14px 0', background: '#006A33', border: 'none', cursor: 'pointer' }}
          >
            {mainLabel}
          </button>

          {/* Skip / secondary */}
          {skipLabel && (
            <button
              onClick={handleSkip}
              className="w-full text-[13px] transition-opacity active:opacity-50"
              style={{ padding: '10px 0', background: 'none', border: 'none', color: 'rgba(255,255,255,0.30)', cursor: 'pointer' }}
            >
              {skipLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export function useInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    const shown = localStorage.getItem(STORAGE_KEY)
    if (!shown) {
      const timer = setTimeout(() => setShowPrompt(true), 3000)
      return () => clearTimeout(timer)
    }
  }, [])

  const dismissPrompt = () => {
    localStorage.setItem(STORAGE_KEY, 'true')
    setShowPrompt(false)
  }

  return { showPrompt, dismissPrompt }
}
