'use client'

import { useState, useEffect } from 'react'
import { Smartphone, Bell, Share, Copy, Check } from 'lucide-react'

const KEY_INSTALL = 'tu-mundial-install-shown'
const KEY_NOTIF   = 'tu-mundial-notif-shown'

// ─── Shared primitives ────────────────────────────────────────────────────────

function Sheet({ children, onDismiss }: { children: React.ReactNode; onDismiss: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center px-3 pb-3"
      style={{ background: 'rgba(5,13,36,0.75)' }}
      onClick={e => { if (e.target === e.currentTarget) onDismiss() }}
    >
      <div className="w-full max-w-sm overflow-hidden"
        style={{ background: '#0A1628', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 20 }}>
        <div className="flex justify-center pt-3 pb-0">
          <div style={{ width: 32, height: 3, background: 'rgba(255,255,255,0.15)', borderRadius: 99 }} />
        </div>
        {children}
      </div>
    </div>
  )
}

function StepRow({ num, children }: { num: number; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-xl"
      style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="flex items-center justify-center flex-shrink-0 text-[11px] font-medium"
        style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(0,106,51,0.2)', border: '1px solid rgba(0,106,51,0.4)', color: '#00C46A' }}>
        {num}
      </div>
      <span className="text-[13px]" style={{ color: 'rgba(255,255,255,0.70)' }}>{children}</span>
    </div>
  )
}

function IconCircle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center mb-4"
      style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(0,106,51,0.15)', border: '1px solid rgba(0,106,51,0.3)' }}>
      {children}
    </div>
  )
}

function PrimaryBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className="w-full text-white text-sm font-medium rounded-xl flex items-center justify-center gap-2 mb-2 transition-opacity active:opacity-75"
      style={{ padding: '14px 0', background: '#006A33', border: 'none', cursor: 'pointer' }}>
      {children}
    </button>
  )
}

function SecondaryBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className="w-full text-[13px] transition-opacity active:opacity-50"
      style={{ padding: '10px 0', background: 'none', border: 'none', color: 'rgba(255,255,255,0.30)', cursor: 'pointer' }}>
      {children}
    </button>
  )
}

// ─── Screen A: iOS but NOT Safari ────────────────────────────────────────────

function ScreenNotSafari({ onDismiss }: { onDismiss: () => void }) {
  const [copied, setCopied] = useState(false)

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(window.location.href) } catch { /* noop */ }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Sheet onDismiss={onDismiss}>
      <div className="p-5">
        <IconCircle><Smartphone size={22} className="text-[#00C46A]" /></IconCircle>
        <p className="text-base font-bold mb-1" style={{ color: '#fff' }}>Abrí esta página en Safari</p>
        <p className="text-[13px] mb-4" style={{ color: 'rgba(255,255,255,0.45)' }}>
          Para instalar TU MUNDIAL en tu iPhone necesitás Safari.
        </p>
        <div className="flex flex-col gap-2 mb-5">
          <StepRow num={1}>Copiá el link</StepRow>
          <StepRow num={2}>Abrí <strong style={{ color: '#fff' }}>Safari</strong></StepRow>
          <StepRow num={3}>Pegá el link y abrí la página</StepRow>
        </div>
        <PrimaryBtn onClick={copyLink}>
          {copied ? <><Check size={15} /> ¡Copiado!</> : <><Copy size={15} /> Copiar link</>}
        </PrimaryBtn>
        <SecondaryBtn onClick={onDismiss}>Cerrar</SecondaryBtn>
      </div>
    </Sheet>
  )
}

// ─── Screen B: iOS Safari, not installed ─────────────────────────────────────

function ScreenInstallIOS({ onDismiss }: { onDismiss: () => void }) {
  return (
    <Sheet onDismiss={onDismiss}>
      <div className="p-5">
        <IconCircle><Smartphone size={22} className="text-[#00C46A]" /></IconCircle>
        <p className="text-base font-bold mb-1" style={{ color: '#fff' }}>Instalá TU MUNDIAL</p>
        <p className="text-[13px] mb-4" style={{ color: 'rgba(255,255,255,0.45)' }}>
          Agregala a tu pantalla de inicio.
        </p>
        <div className="flex flex-col gap-2 mb-5">
          <StepRow num={1}>
            Tocá el ícono <strong style={{ color: '#fff' }}>Compartir</strong>{' '}
            <Share size={11} style={{ display: 'inline', verticalAlign: 'middle' }} />
          </StepRow>
          <StepRow num={2}>Elegí <strong style={{ color: '#fff' }}>Agregar a inicio</strong></StepRow>
          <StepRow num={3}>Tocá <strong style={{ color: '#fff' }}>Agregar</strong></StepRow>
        </div>
        <PrimaryBtn onClick={onDismiss}>Ya la instalé</PrimaryBtn>
        <SecondaryBtn onClick={onDismiss}>Ahora no</SecondaryBtn>
      </div>
    </Sheet>
  )
}

// ─── Screen D: Android + Chrome ───────────────────────────────────────────────

function ScreenInstallAndroid({ onDismiss }: { onDismiss: () => void }) {
  return (
    <Sheet onDismiss={onDismiss}>
      <div className="p-5">
        <IconCircle><Smartphone size={22} className="text-[#00C46A]" /></IconCircle>
        <p className="text-base font-bold mb-1" style={{ color: '#fff' }}>Instalá TU MUNDIAL</p>
        <p className="text-[13px] mb-4" style={{ color: 'rgba(255,255,255,0.45)' }}>
          Agregala a tu pantalla de inicio.
        </p>
        <div className="flex flex-col gap-2 mb-5">
          <StepRow num={1}>Tocá el menú <strong style={{ color: '#fff' }}>⋮</strong> del navegador</StepRow>
          <StepRow num={2}>Elegí <strong style={{ color: '#fff' }}>Instalar app</strong> o <strong style={{ color: '#fff' }}>Agregar a pantalla de inicio</strong></StepRow>
          <StepRow num={3}>Tocá <strong style={{ color: '#fff' }}>Instalar</strong> para confirmar</StepRow>
        </div>
        <PrimaryBtn onClick={onDismiss}>Ya la instalé</PrimaryBtn>
        <SecondaryBtn onClick={onDismiss}>Ahora no</SecondaryBtn>
      </div>
    </Sheet>
  )
}

// ─── Screen E: Android + no Chrome ───────────────────────────────────────────

function ScreenNotChrome({ onDismiss }: { onDismiss: () => void }) {
  const [copied, setCopied] = useState(false)

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(window.location.href) } catch { /* noop */ }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Sheet onDismiss={onDismiss}>
      <div className="p-5">
        <IconCircle><Smartphone size={22} className="text-[#00C46A]" /></IconCircle>
        <p className="text-base font-bold mb-1" style={{ color: '#fff' }}>Abrí esta página en Chrome</p>
        <p className="text-[13px] mb-4" style={{ color: 'rgba(255,255,255,0.45)' }}>
          Para instalar TU MUNDIAL en tu Android necesitás Chrome.
        </p>
        <div className="flex flex-col gap-2 mb-5">
          <StepRow num={1}>Copiá el link</StepRow>
          <StepRow num={2}>Abrí <strong style={{ color: '#fff' }}>Chrome</strong></StepRow>
          <StepRow num={3}>Pegá el link y abrí la página</StepRow>
        </div>
        <PrimaryBtn onClick={copyLink}>
          {copied ? <><Check size={15} /> ¡Copiado!</> : <><Copy size={15} /> Copiar link</>}
        </PrimaryBtn>
        <SecondaryBtn onClick={onDismiss}>Cerrar</SecondaryBtn>
      </div>
    </Sheet>
  )
}

// ─── Screen C: Running as PWA, ask for notifications ─────────────────────────

function ScreenNotifications({ onDismiss }: { onDismiss: () => void }) {
  const handleActivate = async () => {
    try {
      if (window.OneSignalDeferred) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        window.OneSignalDeferred.push(async (OneSignal: any) => {
          await OneSignal.Notifications.requestPermission()
        })
      } else {
        await Notification.requestPermission()
      }
    } catch (e) {
      console.error('[InstallPrompt] notif error:', e)
    }
    onDismiss()
  }

  return (
    <Sheet onDismiss={onDismiss}>
      <div className="p-5">
        <IconCircle><Bell size={22} className="text-[#00C46A]" /></IconCircle>
        <p className="text-base font-bold mb-1" style={{ color: '#fff' }}>Activá las notificaciones</p>
        <p className="text-[13px] mb-4" style={{ color: 'rgba(255,255,255,0.45)' }}>
          Te avisamos antes de que cierre cada predicción.
        </p>
        <div className="flex flex-col gap-2 mb-5">
          <StepRow num={1}>Tocá <strong style={{ color: '#fff' }}>Activar</strong> abajo</StepRow>
          <StepRow num={2}>Cuando aparezca el popup, tocá <strong style={{ color: '#fff' }}>Permitir</strong></StepRow>
        </div>
        <PrimaryBtn onClick={handleActivate}>Activar notificaciones</PrimaryBtn>
        <SecondaryBtn onClick={onDismiss}>Ahora no</SecondaryBtn>
      </div>
    </Sheet>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

type PromptMode = 'not-safari' | 'install-ios' | 'install-android' | 'not-chrome' | 'notifications' | null

export function useInstallPrompt() {
  const [mode, setMode] = useState<PromptMode>(null)

  useEffect(() => {
    const ua           = navigator.userAgent || ''
    const isIOS        = /iPhone|iPad|iPod/.test(ua)
    const isAndroid    = /Android/.test(ua)
    const isSafari     = /Safari/.test(ua) && !/Chrome|CriOS|FxiOS|EdgiOS/.test(ua)
    const isChrome     = /Chrome/.test(ua) && !/Chromium|EdgA|OPR/.test(ua)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window.navigator as any).standalone === true

    console.log('[InstallPrompt] ua:', ua)
    console.log('[InstallPrompt] isIOS:', isIOS, '| isAndroid:', isAndroid, '| isSafari:', isSafari, '| isChrome:', isChrome, '| isStandalone:', isStandalone)
    console.log('[InstallPrompt] install-shown:', localStorage.getItem(KEY_INSTALL), '| notif-shown:', localStorage.getItem(KEY_NOTIF))

    if (isStandalone) {
      if (localStorage.getItem(KEY_NOTIF)) { console.log('[InstallPrompt] skipping - notif already shown'); return }
      console.log('[InstallPrompt] showing notifications in 3s')
      const t = setTimeout(() => setMode('notifications'), 3000)
      return () => clearTimeout(t)
    }

    if (!isIOS && !isAndroid) { console.log('[InstallPrompt] skipping - desktop'); return }
    if (localStorage.getItem(KEY_INSTALL)) { console.log('[InstallPrompt] skipping - install already shown'); return }

    let nextMode: PromptMode
    if (isIOS)      nextMode = isSafari  ? 'install-ios'     : 'not-safari'
    else            nextMode = isChrome  ? 'install-android'  : 'not-chrome'

    console.log(`[InstallPrompt] showing ${nextMode} in 3s`)
    const t = setTimeout(() => setMode(nextMode), 3000)
    return () => clearTimeout(t)
  }, [])

  const dismiss = (key: typeof KEY_INSTALL | typeof KEY_NOTIF) => {
    localStorage.setItem(key, 'true')
    setMode(null)
  }

  return { mode, dismiss }
}

// ─── Public component ─────────────────────────────────────────────────────────

export default function InstallPrompt() {
  const { mode, dismiss } = useInstallPrompt()

  if (mode === 'not-safari')      return <ScreenNotSafari      onDismiss={() => dismiss(KEY_INSTALL)} />
  if (mode === 'install-ios')     return <ScreenInstallIOS     onDismiss={() => dismiss(KEY_INSTALL)} />
  if (mode === 'install-android') return <ScreenInstallAndroid onDismiss={() => dismiss(KEY_INSTALL)} />
  if (mode === 'not-chrome')      return <ScreenNotChrome      onDismiss={() => dismiss(KEY_INSTALL)} />
  if (mode === 'notifications')   return <ScreenNotifications  onDismiss={() => dismiss(KEY_NOTIF)}  />
  return null
}
