'use client'

import Link from 'next/link'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'

function GirisForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const passwordUpdated = searchParams.get('sifre') === 'guncellendi'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => {
      if (user) router.replace('/profil')
    })
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('E-posta veya şifre hatalı.')
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <>
      {passwordUpdated && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-100 px-3 py-2 rounded-lg mb-4 text-center">
          Şifren güncellendi. Yeni şifrenle giriş yapabilirsin.
        </p>
      )}

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

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Şifre</Label>
            <Link href="/sifre-sifirla" className="text-xs text-gray-400 hover:text-primary transition-colors">
              Şifremi unuttum
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
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
          {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
        </Button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        Hesabın yok mu?{' '}
        <Link href="/kayit" className="text-primary hover:underline font-medium">
          Üye ol
        </Link>
      </p>
    </>
  )
}

export default function GirisPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-primary">poketopu</Link>
          <h1 className="text-xl font-bold text-gray-900 mt-6">Giriş Yap</h1>
          <p className="text-sm text-gray-500 mt-1">Hesabına giriş yap</p>
        </div>
        <Suspense>
          <GirisForm />
        </Suspense>
      </div>
    </div>
  )
}
