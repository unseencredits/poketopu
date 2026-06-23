'use client'

import { Turnstile } from '@marsidev/react-turnstile'

export default function TurnstileWidget({ onVerify }: { onVerify: (token: string) => void }) {
  return (
    <Turnstile
      siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
      onSuccess={onVerify}
      options={{ theme: 'light', language: 'tr', size: 'flexible' }}
    />
  )
}
