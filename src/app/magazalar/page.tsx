import { getCachedPartnerStores } from '@/lib/supabase/public'
import Link from 'next/link'
import { MapPin, Globe, Phone, Store, Plus, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Yetkili Mağazalar',
  description: 'Türkiye genelindeki yetkili Pokémon TCG satan mağazalar. Şehir şehir, adres ve iletişim bilgileriyle.',
}

interface PartnerStore {
  id: string
  name: string
  description: string | null
  city: string
  address: string | null
  phone: string | null
  website: string | null
  instagram: string | null
  maps_url: string | null
  store_type: string
}

export default async function MagazalarPage() {
  const stores = await getCachedPartnerStores()

  const grouped = (stores as PartnerStore[]).reduce<Record<string, PartnerStore[]>>((acc, s) => {
    if (!acc[s.city]) acc[s.city] = []
    acc[s.city].push(s)
    return acc
  }, {})

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Yetkili Mağazalar</h1>
        <p className="text-sm text-gray-500 mt-1.5">
          Türkiye genelinde Pokémon TCG ürünleri satan mağazalar.
        </p>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div className="text-center py-20">
          <Store className="h-10 w-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm mb-4">Henüz onaylı mağaza yok.</p>
          <Link href="/magazalar/basvuru">
            <Button variant="outline" className="rounded-xl text-sm">Başvuru Yap</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-10">
          {Object.entries(grouped).map(([city, cityStores]) => (
            <div key={city}>
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                <h2 className="text-base font-bold text-gray-900">{city}</h2>
                <span className="text-xs text-gray-400">({cityStores.length})</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {cityStores.map(s => (
                  <div key={s.id} className="bg-white border border-gray-100 rounded-2xl p-4 hover:border-gray-200 transition-all">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="h-10 w-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
                        <Store className="h-5 w-5 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-sm">{s.name}</h3>
                        <span className="text-[11px] text-gray-400">
                          {s.store_type === 'online' ? 'Online' : s.store_type === 'both' ? 'Fiziksel + Online' : 'Fiziksel Mağaza'}
                        </span>
                      </div>
                    </div>

                    {s.description && (
                      <p className="text-xs text-gray-500 mb-3 leading-relaxed line-clamp-2">{s.description}</p>
                    )}

                    <div className="space-y-1.5">
                      {s.address && (
                        <div className="flex items-start gap-1.5 text-xs text-gray-500">
                          <MapPin className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-gray-400" />
                          <span>{s.address}</span>
                        </div>
                      )}
                      {s.phone && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Phone className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
                          <a href={`tel:${s.phone}`} className="hover:text-primary">{s.phone}</a>
                        </div>
                      )}
                    </div>

                    {(s.website || s.instagram || s.maps_url) && (
                      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-50 flex-wrap">
                        {s.maps_url && (
                          <a href={s.maps_url} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-gray-500 hover:text-emerald-600 transition-colors">
                            <MapPin className="h-3.5 w-3.5" />
                            Haritada gör
                          </a>
                        )}
                        {s.website && (
                          <a href={s.website} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary transition-colors">
                            <Globe className="h-3.5 w-3.5" />
                            Website
                          </a>
                        )}
                        {s.instagram && (
                          <a href={`https://instagram.com/${s.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-gray-500 hover:text-pink-600 transition-colors">
                            <ExternalLink className="h-3.5 w-3.5" />
                            @{s.instagram.replace('@', '')}
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-12 bg-gray-50 rounded-2xl p-6 text-center">
        <h3 className="font-semibold text-gray-900 mb-1.5 text-sm">Mağazanı listelemek ister misin?</h3>
        <p className="text-xs text-gray-500 mb-4">Başvurunu gönder, incelememizin ardından yayına alalım.</p>
        <Link href="/magazalar/basvuru">
          <Button size="sm" className="bg-primary hover:bg-primary/90 text-white rounded-xl gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Başvuru Yap
          </Button>
        </Link>
      </div>
    </div>
  )
}
