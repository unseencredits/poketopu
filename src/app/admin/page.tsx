import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { removeListing, banUser } from './actions'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const supabase = await createClient()

  // Admin kontrolü
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return notFound()
  const { data: profile } = await supabase
    .from('profiles').select('is_admin, username').eq('id', user.id).single()
  if (!profile?.is_admin) return notFound()

  // Son 100 aktif ilan
  const { data: listings } = await supabase
    .from('listings')
    .select('id, price, status, created_at, custom_title, photos, category, product:products(name), store:stores(name, slug, user_id)')
    .neq('status', 'deleted')
    .order('created_at', { ascending: false })
    .limit(100)

  // Son 50 kullanıcı
  const { data: users } = await supabase
    .from('profiles')
    .select('id, username, created_at, is_admin')
    .order('created_at', { ascending: false })
    .limit(50)

  const activeCount = (listings ?? []).filter(l => l.status === 'active').length
  const pausedCount = (listings ?? []).filter(l => l.status === 'paused' || l.status === 'reserved').length

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Paneli</h1>
          <p className="text-sm text-gray-400 mt-0.5">Giriş: @{profile.username}</p>
        </div>
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">← Siteye dön</Link>
      </div>

      {/* Özet */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Toplam İlan', value: listings?.length ?? 0 },
          { label: 'Aktif', value: activeCount },
          { label: 'Bekleyen/Dondurulmuş', value: pausedCount },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white border border-gray-100 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* İlanlar */}
        <div className="lg:col-span-2">
          <h2 className="text-base font-semibold text-gray-900 mb-3">Son İlanlar</h2>
          <div className="space-y-2">
            {(listings ?? []).map(listing => {
              const title = listing.custom_title ?? (listing as { product?: { name: string } } & typeof listing).product?.name ?? '—'
              const store = (Array.isArray(listing.store) ? listing.store[0] : listing.store) as { name: string; slug: string; user_id: string } | null
              const thumb = listing.photos?.[0] ?? null

              return (
                <div key={listing.id} className="bg-white border border-gray-100 rounded-xl p-3 flex items-center gap-3">
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={thumb} alt="" className="h-10 w-8 object-contain rounded flex-shrink-0 bg-gray-50" />
                  ) : (
                    <div className="h-10 w-8 rounded bg-gray-100 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Link href={`/magaza/${store?.slug}`} className="text-xs text-gray-400 hover:text-primary">
                        @{store?.name ?? '—'}
                      </Link>
                      <span className="text-xs text-gray-300">·</span>
                      <span className={`text-xs font-medium ${
                        listing.status === 'active' ? 'text-green-600' :
                        listing.status === 'paused' ? 'text-amber-600' :
                        'text-gray-400'
                      }`}>
                        {listing.status}
                      </span>
                      <span className="text-xs text-gray-300">·</span>
                      <span className="text-xs text-gray-400">{listing.price} ₺</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Link href={`/ilan/${listing.id}`} target="_blank"
                      className="text-xs px-2 py-1 rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100">
                      Gör
                    </Link>
                    <form action={removeListing.bind(null, listing.id)}>
                      <button type="submit"
                        className="text-xs px-2 py-1 rounded-lg bg-red-50 text-red-500 hover:bg-red-100">
                        Kaldır
                      </button>
                    </form>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Kullanıcılar */}
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-3">Son Üyeler</h2>
          <div className="space-y-2">
            {(users ?? []).map(u => (
              <div key={u.id} className="bg-white border border-gray-100 rounded-xl p-3 flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    @{u.username}
                    {u.is_admin && <span className="ml-1 text-[10px] text-primary font-bold">ADMIN</span>}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(u.created_at).toLocaleDateString('tr-TR')}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Link href={`/magaza/${u.username}`} target="_blank"
                    className="text-xs px-2 py-1 rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100">
                    Profil
                  </Link>
                  {!u.is_admin && (
                    <form action={banUser.bind(null, u.id)}>
                      <button type="submit"
                        className="text-xs px-2 py-1 rounded-lg bg-red-50 text-red-500 hover:bg-red-100">
                        İlanları Kaldır
                      </button>
                    </form>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
