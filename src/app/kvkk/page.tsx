import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'KVKK Aydınlatma Metni' }

export default function KVKKPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Kişisel Verilerin Korunması Kanunu (KVKK) Aydınlatma Metni</h1>
        <p className="text-sm text-gray-400 mt-2">Son güncelleme: Haziran 2026</p>
      </div>

      <div className="prose prose-sm prose-gray max-w-none space-y-6 text-gray-600 leading-relaxed">

        <section>
          <h2 className="text-base font-semibold text-gray-800 mb-2">1. Veri Sorumlusu</h2>
          <p>
            Bu aydınlatma metni, 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında, veri sorumlusu sıfatıyla
            <strong className="text-gray-700"> Poketopu</strong> ("Platform") tarafından hazırlanmıştır.
            Platform'a erişim ve üyelik oluşturma yoluyla sağladığınız kişisel veriler aşağıda açıklanan amaçlar ve hukuki dayanaklar çerçevesinde işlenmektedir.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-800 mb-2">2. İşlenen Kişisel Veriler ve İşlenme Amaçları</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse border border-gray-200 rounded-xl overflow-hidden">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-4 py-2 font-medium text-gray-700 border-b border-gray-200">Veri Kategorisi</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-700 border-b border-gray-200">İşlenme Amacı</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['E-posta adresi', 'Hesap oluşturma, e-posta doğrulama, platform bildirimleri'],
                  ['Kullanıcı adı', 'Profil oluşturma ve tanımlama'],
                  ['Telefon numarası (isteğe bağlı)', 'İletişim kolaylığı; yalnızca kullanıcının tercihiyle eklenir'],
                  ['İlan ve içerik bilgileri', 'Kullanıcının platforma eklediği ilan, takas ve etkinlik verileri'],
                  ['İşlem ve alışveriş geçmişi', 'Hizmetin sunulması ve olası anlaşmazlıkların çözümü'],
                  ['IP adresi ve teknik loglar', 'Güvenlik, dolandırıcılık önleme ve yasal yükümlülükler'],
                ].map(([cat, pur]) => (
                  <tr key={cat} className="border-b border-gray-100">
                    <td className="px-4 py-2 font-medium text-gray-700">{cat}</td>
                    <td className="px-4 py-2 text-gray-500">{pur}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-800 mb-2">3. Kullanıcı Tarafından Sağlanan Veriler</h2>
          <p>
            Platform'da yayınlanan ilan, takas teklifi, etkinlik, fiyat, fotoğraf ve benzeri tüm içerikler
            <strong className="text-gray-700"> münhasıran kullanıcı tarafından kendi rızasıyla</strong> sağlanmaktadır.
            Bu içeriklerin doğruluğu, güncelliği ve hukuka uygunluğundan yalnızca içeriği ekleyen kullanıcı sorumludur.
            Platform, kullanıcı tarafından girilen verilerin doğruluğunu teyit etmez ve bu verilerden kaynaklanan
            herhangi bir uyuşmazlık, zarar veya hukuki yükümlülük nedeniyle sorumlu tutulamaz.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-800 mb-2">4. Hukuki Dayanak</h2>
          <p>Kişisel verileriniz aşağıdaki hukuki dayanaklar çerçevesinde işlenmektedir:</p>
          <ul className="list-disc list-inside space-y-1 mt-2 text-sm">
            <li>Sözleşmenin kurulması ve ifası (üyelik sözleşmesi)</li>
            <li>Açık rızanız (isteğe bağlı veri alanları için)</li>
            <li>Meşru menfaat (güvenlik, hizmet iyileştirme)</li>
            <li>Yasal yükümlülük (ilgili mevzuat kapsamında)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-800 mb-2">5. Verilerin Aktarılması</h2>
          <p>
            Kişisel verileriniz; hizmet altyapısını sağlayan yurt dışı kaynaklı teknoloji hizmet sağlayıcılarına
            (bulut depolama, veritabanı, analiz hizmetleri) yalnızca hizmetin sunulması amacıyla aktarılabilir.
            Bu aktarımlar KVKK'nın 9. maddesi kapsamında gerçekleştirilmektedir.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-800 mb-2">6. Veri Sahibi Hakları</h2>
          <p>KVKK'nın 11. maddesi kapsamında aşağıdaki haklara sahipsiniz:</p>
          <ul className="list-disc list-inside space-y-1 mt-2 text-sm">
            <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
            <li>İşlenmişse bilgi talep etme</li>
            <li>İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme</li>
            <li>Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri öğrenme</li>
            <li>Eksik veya yanlış işlenmiş verilerin düzeltilmesini isteme</li>
            <li>KVKK kapsamında silinmesini veya yok edilmesini isteme</li>
            <li>İşlemenin otomatik sistemler vasıtasıyla gerçekleştirilmesi durumunda ortaya çıkabilecek aleyhte sonuca itiraz etme</li>
            <li>Zararın tazminini talep etme</li>
          </ul>
          <p className="mt-3">
            Bu haklarınızı kullanmak için{' '}
            <a href="mailto:destek@poketopu.com" className="text-primary hover:underline">destek@poketopu.com</a>{' '}
            adresine başvurabilirsiniz.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-800 mb-2">7. Çerezler</h2>
          <p>
            Platform, hizmet kalitesini artırmak ve kullanıcı deneyimini iyileştirmek amacıyla çerez kullanabilir.
            Çerez kullanımına ilişkin detaylar için{' '}
            <Link href="/cerez-politikasi" className="text-primary hover:underline">Çerez Politikamızı</Link>{' '}
            inceleyebilirsiniz.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-800 mb-2">8. Sorumluluk Sınırlaması</h2>
          <p>
            Platform yalnızca bir aracı hizmet sağlayıcısı konumundadır. Kullanıcılar arasında gerçekleşen
            alışveriş, takas veya diğer işlemlerden doğan uyuşmazlıklarda Platform'un herhangi bir sorumluluğu
            bulunmamaktadır. Kullanıcılar, platforma ekledikleri içerik ve bilgilerin doğruluğundan ve
            bu içeriklerden doğabilecek hukuki sonuçlardan bizzat sorumludur.
          </p>
        </section>

        <div className="border-t border-gray-100 pt-6 mt-8">
          <Link href="/" className="text-sm text-primary hover:underline">← Anasayfaya Dön</Link>
        </div>
      </div>
    </div>
  )
}
