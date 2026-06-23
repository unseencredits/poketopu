import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  removeListing, banUser,
  approveEvent, rejectEvent, deleteEvent,
  removeTrade,
  approvePartnerStore, rejectPartnerStore, deletePartnerStore,
} from './actions'
import { addFeatureCredits } from '@/app/actions/featuring'
import DeleteUserButton from './DeleteUserButton'
import FeatureCreditButton from './FeatureCreditButton'

export const dynamic = 'force-dynamic'

const TABS = [
  { id: 'ilanlar',    label: 'İlanlar' },
  { id: 'takas',      label: 'Takas' },
  { id: 'etkinlikler',label: 'Etkinlikler' },
  { id: 'magazalar',  label: 'Mağazalar' },
  { id: 'kullanicilar', label: 'Kullanıcılar' },
] as const

type Tab = typeof TABS[number]['id']

interface Props {
  searchParams: Promise<Record<string, string>>
}

export default async function AdminPage({ searchParams }: Props) {
  const params = await searchParams
  const tab: Tab = (params.tab as Tab) ?? 'ilanlar'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return notFound()
  const { data: profile } = await supabase
    .from('profiles').select('is_admin, username').eq('id', user.id).single()
  if (!profile?.is_admin) return notFound()

  // ── İlanlar ──────────────────────────────────────────────────────────────
  const { data: listings } = await supabase
    .from('listings')
    .select('id, price, status, created_at, custom_title, photos, category, product:products(name), store:stores(name, slug, user_id)')
    .neq('status', 'deleted')
    .order('created_at', { ascending: false })
    .limit(100)

  // ── Takas ─────────────────────────────────────────────────────────────────
  const { data: trades } = await supabase
    .from('trades')
    .select('id, type, note, status, created_at, product:products(name), profile:profiles(username)')
    .neq('status', 'deleted')
    .order('created_at', { ascending: false })
    .limit(100)

  // ── Etkinlikler ───────────────────────────────────────────────────────────
  const { data: events } = await supabase
    .from('events')
    .select('id, title, city, event_date, format, status, organizer:profiles!events_organizer_id_fkey(username)')
    .order('created_at', { ascending: false })
    .limit(100)

  // ── Partner Mağazalar ─────────────────────────────────────────────────────
  const { data: partnerStores } = await supabase
    .from('partner_stores')
    .select('id, name, city, store_type, status, address, website, instagram, created_at')
    .order('created_at', { ascending: false })
    .limit(100)

  // ── Kullanıcılar ──────────────────────────────────────────────────────────
  const { data: users } = await supabase
    .from('profiles')
    .select('id, username, created_at, is_admin, feature_credits')
    .order('created_at', { ascending: false })
    .limit(100)

  // Stats
  const pendingEventCount = (events ?? []).filter(e => e.status === 'pending').length
  const pendingStoreCount = (partnerStores ?? []).filter(s => s.status === 'pending').length
  const totalAlerts = pendingEventCount + pendingStoreCount

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Paneli</h1>
          <p className="text-sm text-gray-400 mt-0.5">@{profile.username}</p>
        </div>
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">← Siteye dön</Link>
      </div>

      {/* Özet */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {[
          { label: 'İlan',        value: (listings ?? []).filter(l => l.status === 'active').length },
          { label: 'Takas',       value: (trades ?? []).filter(t => t.status === 'active').length },
          { label: 'Bekl. Etkinlik', value: pendingEventCount, alert: pendingEventCount > 0 },
          { label: 'Bekl. Mağaza',   value: pendingStoreCount, alert: pendingStoreCount > 0 },
          { label: 'Üye',         value: users?.length ?? 0 },
        ].map(({ label, value, alert }) => (
          <div key={label} className={`border rounded-2xl p-3 text-center ${alert ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-100'}`}>
            <p className={`text-xl font-bold ${alert ? 'text-amber-700' : 'text-gray-900'}`}>{value}</p>
            <p className={`text-xs mt-0.5 ${alert ? 'text-amber-600' : 'text-gray-400'}`}>{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 overflow-x-auto">
        {TABS.map(t => {
          const isAlert = (t.id === 'etkinlikler' && pendingEventCount > 0) || (t.id === 'magazalar' && pendingStoreCount > 0)
          return (
            <Link
              key={t.id}
              href={`/admin?tab=${t.id}`}
              className={`relative flex-1 min-w-fit text-center text-xs font-medium py-2 px-3 rounded-lg transition-all whitespace-nowrap ${
                tab === t.id ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
              {isAlert && (
                <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {t.id === 'etkinlikler' ? pendingEventCount : pendingStoreCount}
                </span>
              )}
              {totalAlerts > 0 && t.id === 'ilanlar' && false}
            </Link>
          )
        })}
      </div>

      {/* ── İLANLAR ─────────────────────────────────────────────────────── */}
      {tab === 'ilanlar' && (
        <div className="space-y-2">
          {(listings ?? []).map(listing => {
            const title = listing.custom_title ?? (listing as { product?: { name: string } } & typeof listing).product?.name ?? '—'
            const store = (Array.isArray(listing.store) ? listing.store[0] : listing.store) as { name: string; slug: string } | null
            const thumb = listing.photos?.[0] ?? null
            return (
              <div key={listing.id} className="bg-white border border-gray-100 rounded-xl p-3 flex items-center gap-3">
                {thumb
                  ? <img src={thumb} alt="" className="h-10 w-8 object-contain rounded flex-shrink-0 bg-gray-50" />
                  : <div className="h-10 w-8 rounded bg-gray-100 flex-shrink-0" />
                }
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Link href={`/magaza/${store?.slug}`} className="text-xs text-gray-400 hover:text-primary">@{store?.name ?? '—'}</Link>
                    <span className="text-xs text-gray-300">·</span>
                    <span className={`text-xs font-medium ${listing.status === 'active' ? 'text-green-600' : listing.status === 'paused' ? 'text-amber-600' : 'text-gray-400'}`}>
                      {listing.status}
                    </span>
                    <span className="text-xs text-gray-300">·</span>
                    <span className="text-xs text-gray-400">{listing.price} ₺</span>
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Link href={`/ilan/${listing.id}`} target="_blank" className="text-xs px-2 py-1 rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100">Gör</Link>
                  <form action={removeListing.bind(null, listing.id)}>
                    <button type="submit" className="text-xs px-2 py-1 rounded-lg bg-red-50 text-red-500 hover:bg-red-100">Kaldır</button>
                  </form>
                </div>
              </div>
            )
          })}
          {(listings ?? []).length === 0 && <p className="text-sm text-gray-400 text-center py-8">İlan yok</p>}
        </div>
      )}

      {/* ── TAKAS ────────────────────────────────────────────────────────── */}
      {tab === 'takas' && (
        <div className="space-y-2">
          {(trades ?? []).map(trade => {
            const product = (Array.isArray(trade.product) ? trade.product[0] : trade.product) as { name: string } | null
            const tradeProfile = (Array.isArray(trade.profile) ? trade.profile[0] : trade.profile) as { username: string } | null
            return (
              <div key={trade.id} className="bg-white border border-gray-100 rounded-xl p-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{product?.name ?? '—'}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-400">@{tradeProfile?.username ?? '—'}</span>
                    <span className="text-xs text-gray-300">·</span>
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded-md ${trade.type === 'have' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>
                      {trade.type === 'have' ? 'Satmak/Takas' : 'Arıyorum'}
                    </span>
                    <span className="text-xs text-gray-300">·</span>
                    <span className={`text-xs ${trade.status === 'active' ? 'text-green-600' : 'text-gray-400'}`}>{trade.status}</span>
                  </div>
                  {trade.note && <p className="text-xs text-gray-400 mt-1 truncate">{trade.note}</p>}
                </div>
                <form action={removeTrade.bind(null, trade.id)}>
                  <button type="submit" className="text-xs px-2 py-1 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex-shrink-0">Kaldır</button>
                </form>
              </div>
            )
          })}
          {(trades ?? []).length === 0 && <p className="text-sm text-gray-400 text-center py-8">Takas ilanı yok</p>}
        </div>
      )}

      {/* ── ETKİNLİKLER ──────────────────────────────────────────────────── */}
      {tab === 'etkinlikler' && (
        <div className="space-y-2">
          {(events ?? []).map(ev => {
            const org = (Array.isArray(ev.organizer) ? ev.organizer[0] : ev.organizer) as { username: string } | null
            return (
              <div key={ev.id} className={`bg-white border rounded-xl p-3 ${ev.status === 'pending' ? 'border-amber-100' : 'border-gray-100'}`}>
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-gray-900 truncate">{ev.title}</p>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        ev.status === 'active' ? 'bg-green-100 text-green-700' :
                        ev.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {ev.status === 'active' ? 'Aktif' : ev.status === 'pending' ? 'Bekliyor' : 'İptal'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      @{org?.username ?? '—'} · {ev.city} · {new Date(ev.event_date).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0 mt-0.5">
                    {ev.status === 'pending' && (
                      <>
                        <form action={approveEvent.bind(null, ev.id)}>
                          <button type="submit" className="text-xs px-2 py-1 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 font-medium">Onayla</button>
                        </form>
                        <form action={rejectEvent.bind(null, ev.id)}>
                          <button type="submit" className="text-xs px-2 py-1 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 font-medium">Reddet</button>
                        </form>
                      </>
                    )}
                    <form action={deleteEvent.bind(null, ev.id)}>
                      <button type="submit" className="text-xs px-2 py-1 rounded-lg bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500">Sil</button>
                    </form>
                  </div>
                </div>
              </div>
            )
          })}
          {(events ?? []).length === 0 && <p className="text-sm text-gray-400 text-center py-8">Etkinlik yok</p>}
        </div>
      )}

      {/* ── PARTNER MAĞAZALAR ─────────────────────────────────────────────── */}
      {tab === 'magazalar' && (
        <div className="space-y-2">
          {(partnerStores ?? []).map(s => (
            <div key={s.id} className={`bg-white border rounded-xl p-3 ${s.status === 'pending' ? 'border-amber-100' : 'border-gray-100'}`}>
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-gray-900">{s.name}</p>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      s.status === 'approved' ? 'bg-green-100 text-green-700' :
                      s.status === 'pending'  ? 'bg-amber-100 text-amber-700' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {s.status === 'approved' ? 'Onaylı' : s.status === 'pending' ? 'Bekliyor' : 'Reddedildi'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {s.city} ·{' '}
                    {s.store_type === 'online' ? 'Online' : s.store_type === 'both' ? 'Fiziksel + Online' : 'Fiziksel'}
                    {s.address && ` · ${s.address}`}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    {s.website && <a href={s.website} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline truncate max-w-[180px]">{s.website}</a>}
                    {s.instagram && <span className="text-xs text-gray-400">@{s.instagram}</span>}
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  {s.status === 'pending' && (
                    <>
                      <form action={approvePartnerStore.bind(null, s.id)}>
                        <button type="submit" className="text-xs px-2 py-1 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 font-medium">Onayla</button>
                      </form>
                      <form action={rejectPartnerStore.bind(null, s.id)}>
                        <button type="submit" className="text-xs px-2 py-1 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 font-medium">Reddet</button>
                      </form>
                    </>
                  )}
                  <form action={deletePartnerStore.bind(null, s.id)}>
                    <button type="submit" className="text-xs px-2 py-1 rounded-lg bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500">Sil</button>
                  </form>
                </div>
              </div>
            </div>
          ))}
          {(partnerStores ?? []).length === 0 && <p className="text-sm text-gray-400 text-center py-8">Mağaza başvurusu yok</p>}
        </div>
      )}

      {/* ── KULLANICILAR ─────────────────────────────────────────────────── */}
      {tab === 'kullanicilar' && (
        <div className="space-y-2">
          {(users ?? []).map(u => (
            <div key={u.id} className="bg-white border border-gray-100 rounded-xl p-3 flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  @{u.username}
                  {u.is_admin && <span className="ml-1 text-[10px] text-primary font-bold">ADMIN</span>}
                </p>
                <p className="text-xs text-gray-400">{new Date(u.created_at).toLocaleDateString('tr-TR')}</p>
              </div>
              <div className="flex gap-1 flex-shrink-0 flex-wrap justify-end">
                <Link href={`/magaza/${u.username}`} target="_blank" className="text-xs px-2 py-1 rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100">Profil</Link>
                <FeatureCreditButton userId={u.id} currentCredits={u.feature_credits ?? 0} />
                {!u.is_admin && (
                  <>
                    <form action={banUser.bind(null, u.id)}>
                      <button type="submit" className="text-xs px-2 py-1 rounded-lg bg-orange-50 text-orange-500 hover:bg-orange-100">İlanları Kaldır</button>
                    </form>
                    <DeleteUserButton userId={u.id} username={u.username} />
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
