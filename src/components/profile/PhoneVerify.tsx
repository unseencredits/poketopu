'use client'

import { useState } from 'react'
import { Phone, CheckCircle, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Step = 'idle' | 'sending' | 'otp' | 'verifying' | 'done' | 'error'

export default function PhoneVerify({ currentPhone }: { currentPhone?: string | null }) {
  const [step, setStep] = useState<Step>(currentPhone ? 'done' : 'idle')
  const [phone, setPhone] = useState(currentPhone ?? '')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function sendOtp() {
    setError(null)
    const cleaned = phone.trim().replace(/\s+/g, '')
    const formatted = cleaned.startsWith('+') ? cleaned : `+90${cleaned.replace(/^0/, '')}`
    setPhone(formatted)
    setStep('sending')
    const supabase = createClient()
    const { error: err } = await supabase.auth.signInWithOtp({ phone: formatted })
    if (err) {
      setError(err.message)
      setStep('error')
    } else {
      setStep('otp')
    }
  }

  async function verifyOtp() {
    setError(null)
    setStep('verifying')
    const supabase = createClient()
    const { error: err } = await supabase.auth.verifyOtp({
      phone,
      token: otp.trim(),
      type: 'sms',
    })
    if (err) {
      setError(err.message)
      setStep('otp')
    } else {
      // Telefonu profiles tablosuna da yaz
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('profiles').update({ phone }).eq('id', user.id)
      }
      setStep('done')
    }
  }

  if (step === 'done') {
    return (
      <div className="flex items-center gap-2 text-emerald-600 text-sm">
        <CheckCircle className="h-4 w-4 flex-shrink-0" />
        <span>
          {currentPhone && step === 'done' && !otp
            ? `${phone} — doğrulanmış`
            : `${phone} doğrulandı`}
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {step === 'idle' || step === 'sending' || step === 'error' ? (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="05xxxxxxxxx"
              className="w-full pl-9 pr-3 h-9 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-primary focus:bg-white transition-colors"
            />
          </div>
          <button
            onClick={sendOtp}
            disabled={!phone.trim() || step === 'sending'}
            className="h-9 px-4 rounded-xl bg-primary text-white text-sm font-medium disabled:opacity-40 hover:bg-primary/90 transition-colors flex items-center gap-1.5"
          >
            {step === 'sending' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            SMS Gönder
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={otp}
            onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
            placeholder="6 haneli kod"
            className="flex-1 px-3 h-9 rounded-xl border border-gray-200 bg-gray-50 text-sm text-center tracking-[0.3em] font-mono focus:outline-none focus:border-primary focus:bg-white transition-colors"
            autoFocus
          />
          <button
            onClick={verifyOtp}
            disabled={otp.length < 6 || step === 'verifying'}
            className="h-9 px-4 rounded-xl bg-primary text-white text-sm font-medium disabled:opacity-40 hover:bg-primary/90 transition-colors flex items-center gap-1.5"
          >
            {step === 'verifying' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Doğrula
          </button>
        </div>
      )}

      {step === 'otp' && (
        <p className="text-xs text-gray-400">
          {phone} numarasına SMS gönderildi.{' '}
          <button onClick={() => setStep('idle')} className="text-primary hover:underline">
            Numarayı değiştir
          </button>
        </p>
      )}

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  )
}
