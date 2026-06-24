import Link from 'next/link'
import Image from 'next/image'

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-100 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
          <div>
            <Image src="/logo-colored.svg" alt="Poketopu" width={120} height={28} className="h-7 w-auto" />
            <p className="mt-2 text-sm text-gray-500">
              Türkiye'nin TCG ilan ve takas platformu
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Keşfet</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link href="/kartlar" className="hover:text-red-500">Kartlar</Link></li>
              <li><Link href="/ara?kategori=sealed" className="hover:text-red-500">Sealed Ürünler</Link></li>
              <li><Link href="/ara?kategori=graded" className="hover:text-red-500">Derecelendirilmiş</Link></li>
              <li><Link href="/ara" className="hover:text-red-500">Tüm İlanlar</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Hesap</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link href="/kayit" className="hover:text-red-500">Üye Ol</Link></li>
              <li><Link href="/giris" className="hover:text-red-500">Giriş Yap</Link></li>
              <li><Link href="/ilan-ver" className="hover:text-red-500">İlan Ver</Link></li>
              <li><Link href="/profil" className="hover:text-red-500">Profilim</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Yardım & Hukuki</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link href="/hakkimizda" className="hover:text-red-500">Hakkımızda</Link></li>
              <li><Link href="/iletisim" className="hover:text-red-500">İletişim</Link></li>
              <li><Link href="/kullanim-kosullari" className="hover:text-red-500">Kullanım Koşulları</Link></li>
              <li><Link href="/kvkk" className="hover:text-red-500">KVKK</Link></li>
              <li><Link href="/cerez-politikasi" className="hover:text-red-500">Çerez Politikası</Link></li>
            </ul>
          </div>
        </div>

        {/* Buy me a coffee */}
        <div className="mt-10 rounded-2xl border border-yellow-100 bg-yellow-50/60 px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800">⚡ Poketopu&apos;yu sevdin mi?</p>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Bu platform reklamsız, aboneluksüz ve tamamen hobi olarak yapıldı.
              Sunucu maliyetlerini cebimizden karşılıyoruz — istersen bize bir kahve ısmarlayabilirsin ☕
            </p>
          </div>
          <a
            href="https://www.buymeacoffee.com/poketopu"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-gray-900 text-sm font-semibold transition-colors"
          >
            ☕ Kahve Ismarla
          </a>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200 space-y-3 text-center text-xs text-gray-400">
          <p>
            Poketopu bir ilan ve eşleşme platformudur. Ödeme, kargo ve teslimat işlemleri kullanıcılar
            arasında doğrudan gerçekleşir; Poketopu bu işlemlere taraf değildir ve herhangi bir güvence sunmaz.
          </p>
          <p>
            Poketopu; Nintendo, Creatures Inc., Game Freak veya The Pokémon Company ile bağlantılı,
            onlar tarafından onaylanmış veya desteklenmiş değildir. Pokémon ve tüm ilgili isimler
            sahiplerinin ticari markasıdır.
          </p>
          <p>© {new Date().getFullYear()} poketopu.com — Tüm hakları saklıdır.</p>
          <p>
            poketopu.com bir{' '}
            <a href="http://ucstud.io/" target="_blank" rel="noopener noreferrer" className="hover:text-gray-600 underline underline-offset-2">
              Unseen Credits Studio
            </a>{' '}
            projesidir.
          </p>
        </div>
      </div>
    </footer>
  )
}
