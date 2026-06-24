'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'

export default function SifreGuncellePage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ready, setReady] = useState<'checking' | 'ok' | 'invalid'>('checking')

  useEffect(() => {
    const supabase = createClient()

    // PKCE flow: callback zaten session kurdu, direkt kontrol et
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setReady('ok')
        return
      }
      // Eski hash flow için fallback
      supabase.auth.onAuthStateChange((event) => {
        if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
          setReady('ok')
        }
      })
      // 3 saniye sonra hâlâ session yoksa geçersiz say
      setTimeout(() => {
        setReady(prev => prev === 'checking' ? 'invalid' : prev)
      }, 3000)
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setError('Şifreler eşleşmiyor.')
      return
    }
    if (password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır.')
      return
    }

    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError('Şifre güncellenemedi. Bağlantı süresi dolmuş olabilir.')
      setLoading(false)
      return
    }

    router.push('/giris?sifre=guncellendi')
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-primary">poketopu</Link>
          <h1 className="text-xl font-bold text-gray-900 mt-6">Yeni Şifre Belirle</h1>
          <p className="text-sm text-gray-500 mt-1">En az 6 karakter giriniz.</p>
        </div>

        {ready === 'checking' && (
          <div className="text-center text-sm text-gray-400 py-8">
            Bağlantı doğrulanıyor...
          </div>
        )}

        {ready === 'invalid' && (
          <div className="text-center space-y-4 py-8">
            <p className="text-sm text-red-600 font-medium">Bağlantı geçersiz veya süresi dolmuş.</p>
            <Link href="/sifre-sifirla" className="text-sm text-primary hover:underline">
              Yeni sıfırlama bağlantısı al →
            </Link>
          </div>
        )}

        {ready === 'ok' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="password">Yeni Şifre</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="h-11"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirm">Şifre Tekrar</Label>
              <Input
                id="confirm"
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
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
              {loading ? 'Güncelleniyor...' : 'Şifremi Güncelle'}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
