import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-100 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
          <div>
            <span className="text-lg font-bold text-red-500">poketopu</span>
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
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Yardım</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link href="/hakkimizda" className="hover:text-red-500">Hakkımızda</Link></li>
              <li><Link href="/iletisim" className="hover:text-red-500">İletişim</Link></li>
              <li><Link href="/gizlilik" className="hover:text-red-500">Gizlilik</Link></li>
              <li><Link href="/kullanim-kosullari" className="hover:text-red-500">Kullanım Koşulları</Link></li>
            </ul>
          </div>
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
        </div>
      </div>
    </footer>
  )
}
