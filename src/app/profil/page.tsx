'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { User, Store, Package, LogOut, ChevronRight, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import type { Profile, Store as StoreType, Listing } from '@/types'

export default function ProfilPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [store, setStore] = useState<StoreType | null>(null)
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/giris'); return }

      const [{ data: prof }, { data: st }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('stores').select('*').eq('user_id', user.id).single(),
      ])

      setProfile(prof)
      setStore(st)

      if (st) {
        const { data: myListings } = await supabase
          .from('listings')
          .select('*, product:products(id,name,set_name,image_url)')
          .eq('seller_id', st.id)
          .neq('status', 'deleted')
          .order('created_at', { ascending: false })
          .limit(20)
        setListings((myListings as Listing[]) ?? [])
      }

      setLoading(false)
    }
    load()
  }, [router])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="space-y-3 animate-pulse">
          <div className="h-20 bg-gray-100 rounded-2xl" />
          <div className="h-40 bg-gray-100 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (!profile) return null

  const activeCount = listings.filter(l => l.status === 'active').length
  const soldCount = listings.filter(l => l.status === 'sold').length

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">

      {/* Profil kartı */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
            <User className="h-7 w-7 text-gray-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 text-lg">{profile.full_name ?? profile.username}</p>
            <p className="text-sm text-gray-500">@{profile.username}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-gray-400 hover:text-red-500 gap-1.5"
          >
            <LogOut className="h-4 w-4" />
            Çıkış
          </Button>
        </div>
      </div>

      {/* İstatistikler */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Aktif İlan', value: activeCount },
          { label: 'Satılan', value: soldCount },
          { label: 'Toplam', value: listings.length },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white border border-gray-100 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Mağaza */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-50">
          <div className="flex items-center gap-3">
            <Store className="h-5 w-5 text-gray-400" />
            <p className="font-semibold text-gray-900">Mağazam</p>
          </div>
          {store && (
            <Link href={`/magaza/${store.slug}`} className="text-sm text-primary hover:underline flex items-center gap-1">
              Görüntüle <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>

        {store ? (
          <div className="p-5">
            <p className="font-medium text-gray-900">{store.name}</p>
            <p className="text-sm text-gray-500">poketopu.com/magaza/{store.slug}</p>
          </div>
        ) : (
          <div className="p-5 text-center">
            <p className="text-sm text-gray-500 mb-3">Henüz mağazan yok.</p>
            <Link href="/ilan-ver">
              <Button size="sm" className="bg-primary text-white rounded-lg">İlan Vererek Başla</Button>
            </Link>
          </div>
        )}
      </div>

      {/* İlanlarım */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-50">
          <div className="flex items-center gap-3">
            <Package className="h-5 w-5 text-gray-400" />
            <p className="font-semibold text-gray-900">İlanlarım</p>
          </div>
          <Link href="/ilan-ver">
            <Button size="sm" className="bg-primary text-white rounded-lg gap-1 text-xs h-8">
              <Plus className="h-3.5 w-3.5" /> Yeni
            </Button>
          </Link>
        </div>

        {listings.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-gray-400">Henüz ilan vermedin.</p>
            <Link href="/ilan-ver" className="text-sm text-primary hover:underline mt-1 inline-block">
              İlk ilanını ver →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {listings.map(listing => {
              const title = listing.custom_title ?? (listing as any).product?.name ?? '—'
              const img = listing.photos?.[0] ?? (listing as any).product?.image_url
              return (
                <Link
                  key={listing.id}
                  href={`/ilan/${listing.id}`}
                  className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="h-12 w-9 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                    {img && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img} alt={title} className="h-full w-full object-contain" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                        listing.status === 'active' ? 'bg-green-50 text-green-700' :
                        listing.status === 'sold' ? 'bg-gray-100 text-gray-500' :
                        'bg-yellow-50 text-yellow-700'
                      }`}>
                        {listing.status === 'active' ? 'Aktif' : listing.status === 'sold' ? 'Satıldı' : 'Rezerve'}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-gray-900 flex-shrink-0">
                    {listing.price.toLocaleString('tr-TR')} ₺
                  </p>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
