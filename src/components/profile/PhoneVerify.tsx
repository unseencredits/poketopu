'use client'

import { useState } from 'react'
import { Phone, CheckCircle, Loader2 } from 'lucide-react'
import { sendPhoneOtp, verifyPhoneOtp } from '@/app/actions/phone'

type Step = 'idle' | 'sending' | 'otp' | 'verifying' | 'done' | 'error'

export default function PhoneVerify({ currentPhone }: { currentPhone?: string | null }) {
  const [step, setStep] = useState<Step>(currentPhone ? 'done' : 'idle')
  const [phone, setPhone] = useState(currentPhone ?? '')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function sendOtp() {
    setError(null)
    setStep('sending')
    const res = await sendPhoneOtp(phone)
    if (!res.ok) {
      setError(res.error ?? 'SMS gönderilemedi.')
      setStep('error')
    } else {
      setStep('otp')
    }
  }

  async function verifyOtp() {
    setError(null)
    setStep('verifying')
    const res = await verifyPhoneOtp(phone, otp)
    if (!res.ok) {
      setError(res.error ?? 'Doğrulama başarısız.')
      setStep('otp')
    } else {
      setStep('done')
    }
  }

  if (step === 'done') {
    return (
      <div className="flex items-center gap-2 text-emerald-600 text-sm">
        <CheckCircle className="h-4 w-4 flex-shrink-0" />
        <span>{phone} — doğrulandı</span>
        <button
          onClick={() => { setStep('idle'); setPhone(''); setOtp('') }}
          className="ml-auto text-xs text-gray-400 hover:text-gray-600"
        >
          Değiştir
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {(step === 'idle' || step === 'sending' || step === 'error') ? (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="tel"
              value={phone}
              onChange={e => { setPhone(e.target.value); setError(null) }}
              onKeyDown={e => e.key === 'Enter' && sendOtp()}
              placeholder="05xxxxxxxxx"
              className="w-full pl-9 pr-3 h-9 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-primary focus:bg-white transition-colors"
            />
          </div>
          <button
            onClick={sendOtp}
            disabled={!phone.trim() || step === 'sending'}
            className="h-9 px-4 rounded-xl bg-primary text-white text-sm font-medium disabled:opacity-40 hover:bg-primary/90 transition-colors flex items-center gap-1.5 flex-shrink-0"
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
            onChange={e => { setOtp(e.target.value.replace(/\D/g, '')); setError(null) }}
            onKeyDown={e => e.key === 'Enter' && otp.length === 6 && verifyOtp()}
            placeholder="6 haneli kod"
            className="flex-1 px-3 h-9 rounded-xl border border-gray-200 bg-gray-50 text-sm text-center tracking-[0.3em] font-mono focus:outline-none focus:border-primary focus:bg-white transition-colors"
            autoFocus
          />
          <button
            onClick={verifyOtp}
            disabled={otp.length < 6 || step === 'verifying'}
            className="h-9 px-4 rounded-xl bg-primary text-white text-sm font-medium disabled:opacity-40 hover:bg-primary/90 transition-colors flex items-center gap-1.5 flex-shrink-0"
          >
            {step === 'verifying' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Doğrula
          </button>
        </div>
      )}

      {step === 'otp' && (
        <p className="text-xs text-gray-400">
          <span className="font-medium text-gray-600">{phone}</span> numarasına SMS gönderildi.{' '}
          <button onClick={() => { setStep('idle'); setOtp('') }} className="text-primary hover:underline">
            Numarayı değiştir
          </button>
        </p>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
