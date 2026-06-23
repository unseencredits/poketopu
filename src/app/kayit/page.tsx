'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import TurnstileWidget from '@/components/shared/TurnstileWidget'
import { verifyTurnstile } from '@/app/actions/turnstile'

export default function KayitPage() {
  const router = useRouter()
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => {
      if (user) router.replace('/profil')
    })
  }, [router])

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!turnstileToken) {
      setError('Lütfen robot doğrulamasını tamamlayın.')
      setLoading(false)
      return
    }

    const ok = await verifyTurnstile(turnstileToken)
    if (!ok) {
      setError('Doğrulama başarısız. Sayfayı yenileyip tekrar deneyin.')
      setLoading(false)
      return
    }

    if (form.password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır.')
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { username: form.username },
        emailRedirectTo: `${window.location.origin}/auth/callback?redirect_to=/email-onay`,
      },
    })

    if (error) {
      setError(error.message.includes('already') ? 'Bu e-posta adresi zaten kayıtlı.' : 'Kayıt sırasında bir hata oluştu. Tekrar dene.')
      setLoading(false)
      return
    }

    router.push('/kayit-basarili')
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/">
            <Image src="/logo-colored.svg" alt="Poketopu" width={140} height={33} className="h-8 w-auto mx-auto" />
          </Link>
          <h1 className="text-xl font-bold text-gray-900 mt-6">Hesap Oluştur</h1>
          <p className="text-sm text-gray-500 mt-1">Beta sürecinde tamamen ücretsiz</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="username">Kullanıcı Adı</Label>
            <Input
              id="username"
              value={form.username}
              onChange={e => set('username', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              placeholder="koleksiyoncu123"
              required
              minLength={3}
              maxLength={20}
              className="h-11"
            />
            <p className="text-xs text-gray-400">Sadece harf, rakam ve alt çizgi. Mağaza adresin olacak.</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">E-posta</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={e => set('email', e.target.value)}
              placeholder="ornek@mail.com"
              required
              className="h-11"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Şifre</Label>
            <Input
              id="password"
              type="password"
              value={form.password}
              onChange={e => set('password', e.target.value)}
              placeholder="En az 6 karakter"
              required
              minLength={6}
              className="h-11"
            />
          </div>

          <TurnstileWidget onVerify={setTurnstileToken} />

          {error && (
            <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <Button
            type="submit"
            disabled={loading || !turnstileToken}
            className="w-full h-11 bg-primary hover:bg-primary/90 text-white rounded-xl"
          >
            {loading ? 'Hesap oluşturuluyor...' : 'Üye Ol'}
          </Button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-4">
          Üye olarak{' '}
          <Link href="/kullanim-kosullari" className="underline">Kullanım Koşulları</Link>
          'nı kabul etmiş olursun.
        </p>

        <p className="text-center text-sm text-gray-500 mt-4">
          Zaten hesabın var mı?{' '}
          <Link href="/giris" className="text-primary hover:underline font-medium">Giriş yap</Link>
        </p>
      </div>
    </div>
  )
}
