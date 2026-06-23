import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Çerez Politikası' }

export default function CerezPolitikasiPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Çerez Politikası</h1>
        <p className="text-sm text-gray-400 mt-2">Son güncelleme: Haziran 2026</p>
      </div>

      <div className="space-y-6 text-sm text-gray-600 leading-relaxed">

        <section>
          <h2 className="text-base font-semibold text-gray-800 mb-2">Çerezler Nedir?</h2>
          <p>
            Çerezler, ziyaret ettiğiniz web siteleri tarafından tarayıcınıza yerleştirilen küçük metin dosyalarıdır.
            Bu dosyalar oturum bilgilerini hatırlamak, tercihlerinizi kaydetmek ve site performansını ölçmek gibi amaçlarla kullanılır.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-800 mb-2">Poketopu Hangi Çerezleri Kullanır?</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse border border-gray-200 rounded-xl overflow-hidden">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-4 py-2 font-medium text-gray-700 border-b border-gray-200">Çerez Türü</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-700 border-b border-gray-200">Açıklama</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-700 border-b border-gray-200">Zorunlu mu?</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Oturum Çerezleri', 'Giriş yapan kullanıcının oturumunu açık tutmak için kullanılır. Sayfayı kapattığınızda silinir.', 'Evet'],
                  ['Kimlik Doğrulama', 'Supabase altyapısı tarafından güvenli giriş ve oturum yönetimi için kullanılır.', 'Evet'],
                  ['Analitik (Vercel Analytics)', 'Anonim site trafiği verilerini toplar. Hangi sayfaların daha çok ziyaret edildiğini ölçer. Kişisel veri içermez.', 'Hayır'],
                  ['Performans (Speed Insights)', 'Sayfa yükleme sürelerini ve performans metriklerini ölçer. Kişisel veri içermez.', 'Hayır'],
                ].map(([type, desc, req]) => (
                  <tr key={type} className="border-b border-gray-100">
                    <td className="px-4 py-2 font-medium text-gray-700 whitespace-nowrap">{type}</td>
                    <td className="px-4 py-2 text-gray-500">{desc}</td>
                    <td className="px-4 py-2">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${req === 'Evet' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                        {req}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-800 mb-2">Çerez Tercihleriniz</h2>
          <p>
            Siteye ilk girişinizde çerez tercihlerinizi belirleyebilirsiniz. Zorunlu çerezler hizmetin çalışması için
            gereklidir ve devre dışı bırakılamaz. Analitik çerezleri reddederseniz site istatistikleri için verileriniz
            kullanılmaz; ancak tüm özellikler çalışmaya devam eder.
          </p>
          <p className="mt-2">
            Tercihlerinizi istediğiniz zaman tarayıcınızın çerez ayarlarından veya sayfanın altındaki
            "Çerez Ayarları" bağlantısından değiştirebilirsiniz.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-800 mb-2">Tarayıcı Üzerinden Çerez Yönetimi</h2>
          <p>Tarayıcınızın ayarlarından çerezleri devre dışı bırakabilirsiniz. Ancak bu durumda oturum açma gibi temel özellikler çalışmayabilir.</p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>Chrome: Ayarlar → Gizlilik ve Güvenlik → Çerezler</li>
            <li>Firefox: Ayarlar → Gizlilik ve Güvenlik</li>
            <li>Safari: Tercihler → Gizlilik</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-800 mb-2">İletişim</h2>
          <p>
            Çerez politikamız hakkında sorularınız için{' '}
            <a href="mailto:destek@poketopu.com" className="text-primary hover:underline">destek@poketopu.com</a>{' '}
            adresine yazabilirsiniz.
          </p>
        </section>

        <div className="border-t border-gray-100 pt-6">
          <div className="flex gap-4 text-sm">
            <Link href="/kvkk" className="text-primary hover:underline">KVKK Metni</Link>
            <Link href="/" className="text-gray-400 hover:text-gray-600">Anasayfa</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
