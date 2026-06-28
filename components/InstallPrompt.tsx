'use client'

import { useState, useEffect } from 'react'
import { Smartphone, Bell, Share, Copy, Check } from 'lucide-react'

const STORAGE_KEY = 'tu-mundial-install-prompt-shown'

const STEPS_IOS_SAFARI = [
  { num: 1, text: <span key="1">Tocá el ícono <strong style={{ color: '#fff' }}>Compartir</strong> <Share size={11} style={{ display: 'inline', verticalAlign: 'middle' }} /> en la barra de Safari</span> },
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
  const [isIOS,       setIsIOS]       = useState(false)
  const [isSafari,    setIsSafari]    = useState(false)
  const [isAndroid,   setIsAndroid]   = useState(false)
  const [step,        setStep]        = useState(0)
  const [copied,      setCopied]      = useState(false)

  useEffect(() => {
    const ua = navigator.userAgent || ''
    const ios     = /iPhone|iPad|iPod/.test(ua)
    const safari  = /Safari/.test(ua) && !/Chrome|CriOS|FxiOS/.test(ua)
    const android = /Android/.test(ua)
    setIsIOS(ios)
    setIsSafari(safari)
    setIsAndroid(android)
  }, [])

  const handleNotifications = async () => {
    try {
      if (typeof Notification !== 'undefined' && Notification.permission !== 'denied') {
        await Notification.requestPermission()
      }
    } catch { /* silenciar */ }
    onDismiss()
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* fallback silencioso */
    }
  }

  // iOS but NOT Safari → special "open in Safari" screen
  if (isIOS && !isSafari) {
    return (
      <Overlay onDismiss={onDismiss}>
        <div className="flex justify-center pt-3 pb-1">
          <div style={{ width: 32, height: 3, background: 'rgba(255,255,255,0.15)', borderRadius: 99 }} />
        </div>
        <div className="p-5">
          <div className="flex items-center justify-center mb-4"
            style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(0,106,51,0.15)', border: '1px solid rgba(0,106,51,0.3)' }}>
            <Smartphone size={22} className="text-[#00C46A]" />
          </div>
          <p className="text-base font-bold mb-1" style={{ color: '#fff' }}>Instalá la app</p>
          <p className="text-[13px] mb-4" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Para instalar TU MUNDIAL en tu iPhone, abrí esta página desde{' '}
            <strong style={{ color: '#fff' }}>Safari</strong>.
          </p>
          <p className="text-xs mb-5" style={{ color: 'rgba(255,255,255,0.30)' }}>
            Copiá el link y pegalo en Safari
          </p>
          <button
            onClick={handleCopyLink}
            className="w-full text-white text-sm font-medium rounded-xl flex items-center justify-center gap-2 mb-2 transition-opacity active:opacity-75"
            style={{ padding: '14px 0', background: '#006A33', border: 'none', cursor: 'pointer' }}
          >
            {copied ? <><Check size={15} /> ¡Copiado!</> : <><Copy size={15} /> Copiar link</>}
          </button>
          <button
            onClick={onDismiss}
            className="w-full text-[13px] transition-opacity active:opacity-50"
            style={{ padding: '10px 0', background: 'none', border: 'none', color: 'rgba(255,255,255,0.30)', cursor: 'pointer' }}
          >
            Ahora no
          </button>
        </div>
      </Overlay>
    )
  }

  // Normal flow: step 0 = install, step 1 = notifications
  const installSteps = isAndroid ? STEPS_ANDROID : STEPS_IOS_SAFARI
  const currentSteps = step === 0 ? installSteps : STEPS_NOTIFICATIONS

  const icon      = step === 0 ? <Smartphone size={22} className="text-[#00C46A]" /> : <Bell size={22} className="text-[#00C46A]" />
  const title     = step === 0 ? 'Instalá la app' : 'Activá notificaciones'
  const subtitle  = step === 0 ? 'Accedé más rápido desde tu pantalla de inicio' : 'No te pierdas ningún partido ni predicción'
  const mainLabel = step === 0 ? 'Ya la instalé' : 'Activar notificaciones'
  const skipLabel = step === 0 ? 'Ahora no' : 'Omitir'

  const handleMain = () => {
    if (step === 0) setStep(1)
    else handleNotifications()
  }

  const handleSkip = () => {
    if (step === 0) setStep(1)
    else onDismiss()
  }

  return (
    <Overlay onDismiss={onDismiss}>
      <div className="flex justify-center pt-3 pb-1">
        <div style={{ width: 32, height: 3, background: 'rgba(255,255,255,0.15)', borderRadius: 99 }} />
      </div>
      <div className="p-5">
        {/* Step dots (2 steps) */}
        <div className="flex items-center gap-1.5 mb-5">
          {[0, 1].map(i => (
            <div key={i} className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width:      i === step ? 20 : 6,
                background: i === step ? '#00C46A' : i < step ? 'rgba(0,196,106,0.4)' : 'rgba(255,255,255,0.15)',
              }}
            />
          ))}
        </div>

        <div className="flex items-center justify-center mb-4"
          style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(0,106,51,0.15)', border: '1px solid rgba(0,106,51,0.3)' }}>
          {icon}
        </div>

        <p className="text-base font-bold mb-1" style={{ color: '#fff' }}>{title}</p>
        <p className="text-[13px] mb-4" style={{ color: 'rgba(255,255,255,0.45)' }}>{subtitle}</p>

        <div className="flex flex-col gap-2 mb-5">
          {currentSteps.map(s => (
            <div key={s.num} className="flex items-center gap-3 rounded-xl"
              style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center justify-center flex-shrink-0 text-[11px] font-medium"
                style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(0,106,51,0.2)', border: '1px solid rgba(0,106,51,0.4)', color: '#00C46A' }}>
                {s.num}
              </div>
              <span className="text-[13px]" style={{ color: 'rgba(255,255,255,0.70)' }}>{s.text}</span>
            </div>
          ))}
        </div>

        <button onClick={handleMain}
          className="w-full text-white text-sm font-medium rounded-xl flex items-center justify-center gap-2 mb-2 transition-opacity active:opacity-75"
          style={{ padding: '14px 0', background: '#006A33', border: 'none', cursor: 'pointer' }}>
          {mainLabel}
        </button>
        <button onClick={handleSkip}
          className="w-full text-[13px] transition-opacity active:opacity-50"
          style={{ padding: '10px 0', background: 'none', border: 'none', color: 'rgba(255,255,255,0.30)', cursor: 'pointer' }}>
          {skipLabel}
        </button>
      </div>
    </Overlay>
  )
}

function Overlay({ children, onDismiss }: { children: React.ReactNode; onDismiss: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center px-3 pb-3"
      style={{ background: 'rgba(5,13,36,0.75)' }}
      onClick={e => { if (e.target === e.currentTarget) onDismiss() }}
    >
      <div className="w-full max-w-sm overflow-hidden"
        style={{ background: '#0A1628', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 20 }}>
        {children}
      </div>
    </div>
  )
}

export function useInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    const ua = navigator.userAgent || ''
    const isMobile = /iPhone|iPad|iPod|Android/i.test(ua)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window.navigator as any).standalone === true
    const shown = localStorage.getItem(STORAGE_KEY)

    console.log('[InstallPrompt] ua:', ua)
    console.log('[InstallPrompt] isMobile:', isMobile)
    console.log('[InstallPrompt] isStandalone:', isStandalone)
    console.log('[InstallPrompt] localStorage:', shown)

    if (!isMobile) { console.log('[InstallPrompt] skipping - desktop'); return }
    if (isStandalone) { console.log('[InstallPrompt] skipping - already installed'); return }
    if (shown) { console.log('[InstallPrompt] skipping - already shown'); return }

    console.log('[InstallPrompt] will show in 3s')
    const timer = setTimeout(() => {
      console.log('[InstallPrompt] showing now')
      setShowPrompt(true)
    }, 3000)
    return () => clearTimeout(timer)
  }, [])

  const dismissPrompt = () => {
    localStorage.setItem(STORAGE_KEY, 'true')
    setShowPrompt(false)
  }

  return { showPrompt, dismissPrompt }
}
