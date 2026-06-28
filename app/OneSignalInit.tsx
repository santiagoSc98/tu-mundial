'use client'

import { useEffect } from 'react'
import OneSignal from 'react-onesignal'

export default function OneSignalInit() {
  useEffect(() => {
    OneSignal.init({
      appId: '11c43fd4-40b2-48f3-b460-4bfcadce9213',
      safari_web_id: 'web.onesignal.auto.11c43fd4-40b2-48f3-b460-4bfcadce9213',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      notifyButton: { enable: false } as any,
      allowLocalhostAsSecureOrigin: true,
    })
  }, [])

  return null
}
