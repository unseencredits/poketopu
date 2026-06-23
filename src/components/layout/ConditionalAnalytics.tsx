'use client'

import { useState, useEffect } from 'react'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

export default function ConditionalAnalytics() {
  const [consent, setConsent] = useState<string | null>(null)

  useEffect(() => {
    setConsent(localStorage.getItem('cookie_consent'))
    function onchange() { setConsent(localStorage.getItem('cookie_consent')) }
    window.addEventListener('cookie-consent-changed', onchange)
    return () => window.removeEventListener('cookie-consent-changed', onchange)
  }, [])

  if (consent !== 'accepted') return null
  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  )
}
