import Link from 'next/link'
import { ArrowRight, Search, Sparkles, ShieldCheck, Layers3 } from 'lucide-react'
import { Button } from '@/components/ui/button'

const SETS = [
  { name: 'Scarlet & Violet', slug: 'sv1', color: 'from-violet-100 to-purple-50' },
  { name: 'Temporal Forces', slug: 'sv5', color: 'from-blue-100 to-sky-50' },
  { name: 'Paldean Fates', slug: 'sv4pt5', color: 'from-pink-100 to-rose-50' },
  { name: 'Obsidian Flames', slug: 'sv3', color: 'from-orange-100 to-amber-50' },
  { name: 'Pokemon 151', slug: 'sv3pt5', color: 'from-red-100 to-rose-50' },
  { name: 'Base Set', slug: 'base1', color: 'from-yellow-100 to-amber-50' },
]

const CONDITIONS = [
  { code: 'NM', label: 'Near Mint', stars: 5, cls: 'condition-nm' },
  { code: 'LP', label: 'Lightly Played', stars: 4, cls: 'condition-lp' },
  { code: 'MP', label: 'Moderately Played', stars: 3, cls: 'condition-mp' },
  { code: 'HP', label: 'Heavily Played', stars: 2, cls: 'condition-hp' },
  { code: 'D',  label: 'Damaged', stars: 1, cls: 'condition-d' },
]

export default function HomePage() {
  return (
    <div className="pb-20">

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,oklch(0.96_0.03_25),transparent)]" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-20 pb-24 text-center">
          <div className="inline-flex items-center gap-2 bg-red-50 border border-red-100 rounded-full px-4 py-1.5 text-xs font-medium text-red-600 mb-8">
            <Sparkles className="h-3.5 w-3.5" />
            Beta — Şimdilik tamamen ücretsiz
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold text-gray-950 mb-5" style={{ letterSpacing: '-0.03em' }}>
            Koleksiyonunu büyüt.
            <br />
            <span className="text-primary">Pokemon TCG</span> pazaryeri.
          </h1>

          <p className="text-lg text-gray-500 mb-10 max-w-lg mx-auto leading-relaxed">
            Kartlarını sat, ihtiyacın olanı bul. Tek ürün sayfasında tüm satıcıları karşılaştır.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/ara">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white rounded-xl h-12 px-6 text-base gap-2 shadow-md shadow-primary/20">
                <Search className="h-5 w-5" />
                Kart Ara
              </Button>
            </Link>
            <Link href="/ilan-ver">
              <Button size="lg" variant="outline" className="rounded-xl h-12 px-6 text-base gap-2 border-gray-200">
                İlan Ver
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {/* Stat strip */}
          <div className="mt-14 flex items-center justify-center gap-8 sm:gap-14 text-center">
            {[
              { n: 'Beta', label: 'Açık' },
              { n: '0₺', label: 'Listeleme ücreti' },
              { n: 'TCG', label: 'Standart koşullar' },
            ].map(({ n, label }) => (
              <div key={label}>
                <p className="text-2xl font-bold text-gray-900">{n}</p>
                <p className="text-xs text-gray-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ÖZELLİKLER ── */}
      <section className="py-16 px-4 border-y border-gray-100 bg-gray-50/50">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            {
              icon: <Layers3 className="h-5 w-5 text-primary" />,
              title: 'Tek ürün, tüm satıcılar',
              desc: 'Aynı kart için farklı satıcıları ve koşulları tek sayfada karşılaştır.',
            },
            {
              icon: <ShieldCheck className="h-5 w-5 text-primary" />,
              title: 'Standart koşul sistemi',
              desc: 'NM → Damaged arası TCG standardı değerlendirme. Yıldız görünümü ile anlık okuma.',
            },
            {
              icon: <Search className="h-5 w-5 text-primary" />,
              title: 'Güçlü arama & filtre',
              desc: 'Set, nadirlik, koşul, fiyat aralığına göre anında filtrele.',
            },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="flex gap-4 p-5 rounded-2xl bg-white border border-gray-100">
              <div className="flex-shrink-0 mt-0.5 h-9 w-9 rounded-xl bg-red-50 flex items-center justify-center">
                {icon}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
                <p className="text-sm text-gray-500 mt-1 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── KOŞUL SİSTEMİ ── */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Koşul Değerlendirme Sistemi</h2>
            <p className="text-sm text-gray-500 mt-1">Her ilan için standart TCG koşul ölçeği kullanılır.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {CONDITIONS.map(({ code, label, stars, cls }) => (
              <div key={code} className="rounded-2xl border border-gray-100 bg-white p-4 text-center">
                <span className={`inline-block px-3 py-1.5 rounded-full text-sm font-bold ${cls}`}>
                  {code}
                </span>
                <div className="mt-2 text-sm text-gray-400 tracking-[-2px]">
                  {'★'.repeat(stars)}{'☆'.repeat(5 - stars)}
                </div>
                <p className="mt-1.5 text-xs text-gray-500 font-medium">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SETLER ── */}
      <section className="py-6 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Popüler Setler</h2>
            <Link href="/kartlar" className="text-sm text-primary hover:text-primary/80 flex items-center gap-1 font-medium">
              Tüm setler <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {SETS.map(({ name, slug, color }) => (
              <Link
                key={slug}
                href={`/set/${slug}`}
                className={`group p-4 rounded-2xl bg-gradient-to-br ${color} border border-white hover:border-primary/20 hover:shadow-md transition-all`}
              >
                <div className="h-8 w-8 rounded-lg bg-white/60 mb-3 group-hover:bg-white transition-colors" />
                <p className="text-xs font-semibold text-gray-800 leading-tight">{name}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── SON İLANLAR placeholder ── */}
      <section className="py-6 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Son Eklenenler</h2>
            <Link href="/ara" className="text-sm text-primary hover:text-primary/80 flex items-center gap-1 font-medium">
              Tümünü gör <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
                <div className="aspect-[3/4] bg-gray-50 animate-pulse" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-gray-100 rounded-full w-4/5 animate-pulse" />
                  <div className="h-3 bg-gray-100 rounded-full w-3/5 animate-pulse" />
                  <div className="h-4 bg-gray-100 rounded-full w-2/5 animate-pulse mt-3" />
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-gray-400 mt-8">
            Henüz ilan yok.{' '}
            <Link href="/ilan-ver" className="text-primary hover:underline">İlk ilanı sen ver →</Link>
          </p>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16 px-4">
        <div className="max-w-2xl mx-auto text-center bg-gray-950 rounded-3xl p-10">
          <h2 className="text-3xl font-bold text-white mb-3">Koleksiyonunu sat.</h2>
          <p className="text-gray-400 mb-7 text-sm">Birkaç dakikada mağazanı aç, kartlarını listele.</p>
          <Link href="/kayit">
            <Button size="lg" className="bg-white text-gray-950 hover:bg-gray-100 rounded-xl h-12 px-8 text-base font-semibold">
              Ücretsiz Başla
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
