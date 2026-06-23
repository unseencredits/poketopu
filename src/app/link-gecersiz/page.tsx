'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { AlertTriangle, RefreshCw, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'

export default function LinkGecersizPage() {
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function resend(e: React.FormEvent) {
    e.preventDefault()
    if (!email || sending) return
    setSending(true)
    setError(null)
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
      setError('E-posta gönderilemedi. Adresin doğru mu kontrol et.')
    } else {
      setSent(true)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm text-center">
        <Link href="/">
          <Image src="/logo-colored.svg" alt="Poketopu" width={140} height={33} className="h-8 w-auto mx-auto mb-10" />
        </Link>

        <div className="h-16 w-16 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="h-8 w-8 text-amber-500" />
        </div>

        <h1 className="text-xl font-bold text-gray-900 mb-3">Link geçersiz veya süresi dolmuş</h1>
        <p className="text-sm text-gray-500 leading-relaxed mb-8">
          Bu onay linki daha önce kullanılmış ya da yeni bir link talep edilmiş.
          E-posta adresini girerek yeni bir link gönderebiliriz.
        </p>

        {sent ? (
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5">
            <div className="flex items-center justify-center gap-2 text-emerald-700 font-medium mb-1">
              <CheckCircle className="h-4 w-4" />
              Yeni link gönderildi
            </div>
            <p className="text-xs text-emerald-600">Gelen kutunu kontrol et. Spam klasörünü de unutma.</p>
          </div>
        ) : (
          <form onSubmit={resend} className="text-left space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="email">E-posta adresin</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="ornek@mail.com"
                required
                className="h-11"
              />
            </div>
            {error && (
              <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}
            <Button
              type="submit"
              disabled={sending}
              className="w-full h-11 bg-primary hover:bg-primary/90 text-white rounded-xl gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${sending ? 'animate-spin' : ''}`} />
              {sending ? 'Gönderiliyor...' : 'Yeni Onay Linki Gönder'}
            </Button>
          </form>
        )}

        <div className="flex items-center gap-4 mt-8 text-xs text-gray-400">
          <Link href="/giris" className="hover:text-primary transition-colors">Giriş yap</Link>
          <span>·</span>
          <Link href="/" className="hover:text-primary transition-colors">Anasayfa</Link>
        </div>
      </div>
    </div>
  )
}
