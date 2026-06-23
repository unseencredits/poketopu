'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Mail, RefreshCw, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

function KayitBasariliContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email') ?? ''

  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [resendError, setResendError] = useState<string | null>(null)

  async function resend() {
    if (!email || sending) return
    setSending(true)
    setResendError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?redirect_to=/email-onay`,
      },
    })
    setSending(false)
    if (error) {
      setResendError('Gönderilemedi. Biraz bekleyip tekrar dene.')
    } else {
      setSent(true)
    }
  }

  return (
    <div className="w-full max-w-sm text-center">
      <Link href="/">
        <Image src="/logo-colored.svg" alt="Poketopu" width={140} height={33} className="h-8 w-auto mx-auto mb-10" />
      </Link>

      <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
        <Mail className="h-8 w-8 text-primary" />
      </div>

      <h1 className="text-xl font-bold text-gray-900 mb-4">E-postanı onayla</h1>

      {email && (
        <div className="inline-flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 mb-5">
          <Mail className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
          <span className="text-sm font-medium text-gray-700">{email}</span>
        </div>
      )}

      <p className="text-sm text-gray-500 leading-relaxed mb-2">
        Yukarıdaki adrese bir onay bağlantısı gönderdik.
      </p>
      <p className="text-sm text-gray-500 leading-relaxed mb-6">
        Gelen kutunu aç ve <strong className="text-gray-700">E-postamı Onayla</strong> butonuna tıkla. Spam klasörünü de kontrol etmeyi unutma.
      </p>

      <div className="text-left bg-gray-50 rounded-xl p-3.5 text-xs text-gray-500 mb-8">
        <p className="font-medium text-gray-600 mb-0.5">Gönderen adres:</p>
        <p>noreply@poketopu.com</p>
      </div>

      {/* Tekrar gönder */}
      <div className="border-t border-gray-100 pt-6">
        <p className="text-xs text-gray-400 mb-3">E-posta gelmedi mi?</p>
        {sent ? (
          <div className="flex items-center justify-center gap-2 text-emerald-600 text-sm font-medium">
            <CheckCircle className="h-4 w-4" />
            E-posta tekrar gönderildi
          </div>
        ) : (
          <>
            {resendError && (
              <p className="text-xs text-red-500 mb-2">{resendError}</p>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={resend}
              disabled={sending || !email}
              className="rounded-xl gap-2 text-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${sending ? 'animate-spin' : ''}`} />
              {sending ? 'Gönderiliyor...' : 'Tekrar Gönder'}
            </Button>
          </>
        )}
      </div>

      <p className="text-xs text-gray-400 mt-8">
        Zaten hesabın var mı?{' '}
        <Link href="/giris" className="text-primary hover:underline">Giriş yap</Link>
      </p>
    </div>
  )
}

export default function KayitBasariliPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <Suspense>
        <KayitBasariliContent />
      </Suspense>
    </div>
  )
}
