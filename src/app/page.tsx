import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Search, Info, Layers3, BookMarked, Bell, ArrowRightLeft, Trophy, TrendingDown, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import ListingGrid from '@/components/cards/ListingGrid'
import type { Listing } from '@/types'

const SETS = [
  { name: 'Scarlet & Violet', id: 'sv1', color: 'from-violet-100 to-purple-50' },
  { name: 'Temporal Forces', id: 'sv5', color: 'from-blue-100 to-sky-50' },
  { name: 'Paldean Fates', id: 'sv4pt5', color: 'from-pink-100 to-rose-50' },
  { name: 'Obsidian Flames', id: 'sv3', color: 'from-orange-100 to-amber-50' },
  { name: 'Pokémon 151', id: 'sv3pt5', color: 'from-red-100 to-rose-50' },
  { name: 'Paradox Rift', id: 'sv4', color: 'from-yellow-100 to-amber-50' },
]

const FEATURES = [
  {
    icon: <Layers3 className="h-5 w-5 text-primary" />,
    title: 'Tek ürün, tüm satıcılar',
    desc: 'Aynı kart için farklı satıcıları ve koşulları tek sayfada karşılaştır.',
  },
  {
    icon: <TrendingDown className="h-5 w-5 text-blue-500" />,
    title: 'Referans fiyatlar',
    desc: 'Her kart sayfasında Cardmarket ve TCGPlayer güncel piyasa fiyatları.',
    href: '/kartlar',
  },
  {
    icon: <BookMarked className="h-5 w-5 text-emerald-500" />,
    title: 'Koleksiyon takibi',
    desc: 'Sahip olduğun kartları kaydet, koleksiyonunu takip et.',
    href: '/profil',
  },
  {
    icon: <Bell className="h-5 w-5 text-amber-500" />,
    title: 'Fiyat alarmı',
    desc: 'Aradığın kart hedef fiyatına düştüğünde sana bildirilsin.',
    href: '/profil',
  },
  {
    icon: <ArrowRightLeft className="h-5 w-5 text-violet-500" />,
    title: 'Takas eşleştirme',
    desc: 'Takas ilanları ver, istediğin kartı elinde bulunduran koleksiyoncuları bul.',
    href: '/takas',
  },
  {
    icon: <Tag className="h-5 w-5 text-orange-500" />,
    title: 'Teklif sistemi',
    desc: 'Beğendiğin ilana teklif ver, satıcıyla fiyat üzerinde anlaş.',
  },
  {
    icon: <Info className="h-5 w-5 text-primary" />,
    title: 'Güvenli işlem rehberi',
    desc: 'Sahte kart tespiti, güvenli elden teslim ve dolandırıcılık uyarıları.',
  },
  {
    icon: <Trophy className="h-5 w-5 text-yellow-500" />,
    title: 'Turnuva & etkinlik',
    desc: 'Türkiye genelindeki Pokemon turnuvalarını takip et, kayıt ol.',
    href: '/turnuva',
  },
]

export default async function HomePage() {
  const supabase = await createClient()
  const { data: recentRaw } = await supabase
    .from('listings')
    .select('*, product:products(id,name,set_name,number,image_url), store:stores(id,name,slug)')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(6)
  const recentListings = (recentRaw as Listing[]) ?? []

  return (
    <div className="pb-20">

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,oklch(0.96_0.03_25),transparent)]" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-16 pb-20 text-center">

          <h1 className="text-4xl sm:text-6xl font-bold text-gray-950 mb-5" style={{ letterSpacing: '-0.03em' }}>
            Aradığın kartı bul,
            <br />
            <span className="text-primary">koleksiyoncularla</span> tanış.
          </h1>

          <p className="text-base sm:text-lg text-gray-500 mb-8 max-w-lg mx-auto leading-relaxed">
            Poketopu, Pokémon TCG koleksiyoncularını buluşturan ücretsiz ilan ve takas platformudur.
            Ödeme, kargo ve teslimat kullanıcılar arasında doğrudan gerçekleşir.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/ara">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white rounded-xl h-12 px-6 text-base gap-2 shadow-md shadow-primary/20">
                <Search className="h-5 w-5" />
                İlanları Keşfet
              </Button>
            </Link>
            <Link href="/ilan-ver">
              <Button size="lg" variant="outline" className="rounded-xl h-12 px-6 text-base gap-2 border-gray-200">
                Ücretsiz İlan Ver
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <p className="mt-5 text-xs text-gray-400">
            Poketopu ödeme veya kargo hizmeti sunmaz.{' '}
            <Link href="/kullanim-kosullari" className="underline underline-offset-2 hover:text-gray-600">
              Kullanım koşullarını inceleyin →
            </Link>
          </p>

          {/* Stat strip */}
          <div className="mt-12 flex items-center justify-center gap-8 sm:gap-14 text-center">
            {[
              { n: 'Beta', label: 'Şu an açık, ücretsiz' },
              { n: '0₺', label: 'Listeleme ücreti yok' },
              { n: 'NM → D', label: '5 adımlı koşul ölçeği' },
            ].map(({ n, label }) => (
              <div key={label}>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{n}</p>
                <p className="text-xs text-gray-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PLATFORM ÖZELLİKLERİ ── */}
      <section className="py-14 px-4 bg-gray-50/60 border-y border-gray-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Her şey tek platformda</h2>
            <p className="text-sm text-gray-500 mt-2">Koleksiyonundan pazarlığa, takasdan turnuvaya.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {FEATURES.map(({ icon, title, desc, href }) => {
              const content = (
                <div className="flex flex-col gap-3 p-4 rounded-2xl bg-white border border-gray-100 h-full hover:border-gray-200 hover:shadow-sm transition-all">
                  <div className="h-9 w-9 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                    {icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm leading-tight">{title}</h3>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">{desc}</p>
                  </div>
                </div>
              )
              return href ? (
                <Link key={title} href={href}>{content}</Link>
              ) : (
                <div key={title}>{content}</div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── SETLER ── */}
      <section className="py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Popüler Setler</h2>
            <Link href="/kartlar" className="text-sm text-primary hover:text-primary/80 flex items-center gap-1 font-medium">
              Tüm setler <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {SETS.map(({ name, id, color }) => (
              <Link
                key={id}
                href={`/ara?set_id=${id}&kategori=card`}
                className={`group p-3 sm:p-4 rounded-2xl bg-gradient-to-br ${color} border border-white hover:border-primary/20 hover:shadow-md transition-all`}
              >
                <div className="relative h-8 sm:h-10 w-full mb-2 sm:mb-3">
                  <Image
                    src={`https://images.pokemontcg.io/${id}/logo.png`}
                    alt={name}
                    fill
                    className="object-contain object-left mix-blend-multiply"
                  />
                </div>
                <p className="text-xs font-semibold text-gray-800 leading-tight">{name}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── SON İLANLAR ── */}
      {recentListings.length > 0 && (
        <section className="py-6 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Son Eklenenler</h2>
              <Link href="/ara" className="text-sm text-primary hover:text-primary/80 flex items-center gap-1 font-medium">
                Tümünü gör <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <ListingGrid listings={recentListings} />
            </div>
          </div>
        </section>
      )}

      {/* ── CTA ── */}
      <section className="py-16 px-4">
        <div className="max-w-2xl mx-auto text-center bg-gray-950 rounded-3xl p-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Profilini oluştur, kartlarını listele.</h2>
          <p className="text-gray-400 mb-7 text-sm">İlan vermek ve kullanıcılarla iletişim kurmak tamamen ücretsizdir.</p>
          <Link href="/kayit">
            <Button size="lg" className="bg-white text-gray-950 hover:bg-gray-100 rounded-xl h-12 px-8 text-base font-semibold">
              Ücretsiz Üye Ol
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
