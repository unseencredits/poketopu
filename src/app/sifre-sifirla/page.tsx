'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'

export default function SifreSifirlaPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?redirect_to=/sifre-guncelle`,
    })

    if (error) {
      setError('Bir hata oluştu. Lütfen tekrar deneyin.')
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-primary">poketopu</Link>
          <h1 className="text-xl font-bold text-gray-900 mt-6">Şifremi Unuttum</h1>
          <p className="text-sm text-gray-500 mt-1">
            E-posta adresini gir, şifre sıfırlama bağlantısı gönderelim.
          </p>
        </div>

        {sent ? (
          <div className="text-center space-y-4">
            <div className="h-14 w-14 rounded-full bg-green-50 flex items-center justify-center mx-auto">
              <svg className="h-7 w-7 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm text-gray-700 font-medium">Bağlantı gönderildi!</p>
            <p className="text-xs text-gray-500 leading-relaxed">
              <span className="font-medium">{email}</span> adresine şifre sıfırlama bağlantısı gönderdik.
              Gelen kutunu kontrol et.
            </p>
            <Link href="/giris" className="block mt-4 text-sm text-primary hover:underline">
              Giriş sayfasına dön
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">E-posta</Label>
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
              disabled={loading}
              className="w-full h-11 bg-primary hover:bg-primary/90 text-white rounded-xl"
            >
              {loading ? 'Gönderiliyor...' : 'Sıfırlama Bağlantısı Gönder'}
            </Button>

            <p className="text-center text-sm text-gray-500">
              <Link href="/giris" className="text-primary hover:underline font-medium">
                Giriş sayfasına dön
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
