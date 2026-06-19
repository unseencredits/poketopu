'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'

export default function KayitPage() {
  const router = useRouter()
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (form.password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır.')
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { username: form.username } },
    })

    if (error) {
      if (error.message.includes('already')) {
        setError('Bu e-posta adresi zaten kayıtlı.')
      } else {
        setError('Kayıt sırasında bir hata oluştu. Tekrar dene.')
      }
      setLoading(false)
      return
    }

    router.push('/?kayit=basarili')
    router.refresh()
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-primary">poketopu</Link>
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

          {error && (
            <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <Button
            type="submit"
            disabled={loading}
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
          <Link href="/giris" className="text-primary hover:underline font-medium">
            Giriş yap
          </Link>
        </p>
      </div>
    </div>
  )
}
