'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { submitPartnerStore } from '@/app/actions/magazalar'
import { CheckCircle } from 'lucide-react'

export default function MagazaBasvuruPage() {
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await submitPartnerStore(new FormData(e.currentTarget))
      setDone(true)
    } catch {
      setError('Gönderim sırasında bir hata oluştu. Tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Başvurun Alındı</h1>
          <p className="text-sm text-gray-500 mb-6">
            Mağazanı inceleyip onayladıktan sonra yayına alacağız. Teşekkürler!
          </p>
          <Link href="/magazalar">
            <Button variant="outline" className="rounded-xl">Mağazalara Dön</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Mağaza Başvurusu</h1>
        <p className="text-sm text-gray-500 mt-1.5">
          Pokémon TCG satan mağazanı listelemek için formu doldur.
          Admin incelemesinin ardından yayına alınır.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Mağaza Adı *</Label>
            <Input id="name" name="name" required placeholder="PokéShop İstanbul" className="h-11" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="city">Şehir *</Label>
            <Input id="city" name="city" required placeholder="İstanbul" className="h-11" />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="store_type">Mağaza Türü</Label>
          <select id="store_type" name="store_type"
            className="w-full h-11 rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="retail">Fiziksel Mağaza</option>
            <option value="online">Online Mağaza</option>
            <option value="both">Fiziksel + Online</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="address">Adres</Label>
          <Input id="address" name="address" placeholder="Mahalle, cadde, sokak..." className="h-11" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Kısa Açıklama</Label>
          <textarea
            id="description"
            name="description"
            rows={3}
            placeholder="Mağaza hakkında kısa bir bilgi..."
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="phone">Telefon</Label>
            <Input id="phone" name="phone" type="tel" placeholder="05xx xxx xx xx" className="h-11" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">E-posta</Label>
            <Input id="email" name="email" type="email" placeholder="magaza@mail.com" className="h-11" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="website">Web Sitesi</Label>
            <Input id="website" name="website" type="url" placeholder="https://..." className="h-11" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="instagram">Instagram</Label>
            <Input id="instagram" name="instagram" placeholder="@magazaadi" className="h-11" />
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        )}

        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" disabled={loading}
            className="bg-primary hover:bg-primary/90 text-white rounded-xl h-11 px-6">
            {loading ? 'Gönderiliyor...' : 'Başvuruyu Gönder'}
          </Button>
          <Link href="/magazalar">
            <Button type="button" variant="ghost" className="rounded-xl h-11">İptal</Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
