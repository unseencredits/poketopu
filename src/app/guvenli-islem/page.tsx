import Link from 'next/link'
import { ShieldCheck, AlertTriangle, MapPin, MessageCircle, Star, Package } from 'lucide-react'

export const metadata = {
  title: 'Güvenli İşlem Rehberi',
  description: 'Poketopu\'da alım-satım yaparken güvende kalmanızı sağlayacak ipuçları.',
}

const SECTIONS = [
  {
    icon: <MessageCircle className="h-5 w-5 text-blue-500" />,
    title: 'Platform içinde iletişim kurun',
    items: [
      'Tüm görüşmeleri platform içindeki mesaj sistemi üzerinden yürütün. Olası bir anlaşmazlıkta yazışma geçmişi kanıt niteliği taşır.',
      'Tanımadığınız satıcılar WhatsApp, Telegram veya Discord\'a geçmeyi teklif ederse dikkatli olun.',
      'Kişisel bilgilerinizi (TC, banka hesabı, şifre) hiçbir zaman mesajla paylaşmayın.',
    ],
  },
  {
    icon: <MapPin className="h-5 w-5 text-emerald-500" />,
    title: 'Elden teslimatta güvende kalın',
    items: [
      'Tanışmayı kalabalık, aydınlık ve güvenli bir yerde yapın (AVM, kafe, metro çıkışı).',
      'Mümkünse yalnız gitmeyin; yanınızda birini götürün.',
      'Kartı teslim almadan önce yerinde inceleme hakkınızı kullanın.',
      'Ödemeyi nakit yapıyorsanız parayı teslim almadan önce kartı kontrol edin.',
    ],
  },
  {
    icon: <Package className="h-5 w-5 text-violet-500" />,
    title: 'Kargo ile alım-satım',
    items: [
      'Kargo tercihini her zaman takip numaralı seçin; hem alıcı hem satıcı için korumalıdır.',
      'Satıcıdan kargo fişi fotoğrafı isteyin; bu kargonun gerçekten gönderildiğini kanıtlar.',
      'Paketi açarken video çekin; hasar durumunda kargo firmasına ve satıcıya karşı kanıt olarak işe yarar.',
      'Kargo ücreti konusunda önceden netleşin; ilan fiyatına dahil mi, ayrı mı?',
    ],
  },
  {
    icon: <Star className="h-5 w-5 text-amber-500" />,
    title: 'Satıcıyı değerlendirin',
    items: [
      'Satıcının profil sayfasını inceleyin: üyelik tarihi, aktif ilan sayısı ve değerlendirme puanı.',
      'Hiç değerlendirmesi olmayan, çok yeni hesaplara karşı daha temkinli olun.',
      'İlk kez alışveriş yaptığınız satıcıyla küçük bir işlemle başlayın.',
      'İşlem sonrası değerlendirme bırakın. Güvenli bir topluluk oluşturmak hepimizin sorumluluğu.',
    ],
  },
  {
    icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
    title: 'Sahte kart tespiti',
    items: [
      'Fiyat piyasanın çok altındaysa neden bu kadar ucuz olduğunu sorgulayın.',
      'Satıcıdan kartın arka yüzü, köşeleri ve yüzeyi dahil net fotoğraflar isteyin.',
      'Işık geçirgenlik testi: gerçek kartlar ışık tutulduğunda siyah katman gösterir.',
      'PSA/BGS gibi profesyonel derecelendirme sertifikaları doğrulanabilir (grader websitelerinden sorgulayın).',
    ],
  },
]

const RED_FLAGS = [
  '"Acil satış" veya "bugün kapatıyorum" gibi baskı uygulanması',
  'Havale / EFT öncesi kargo talep edilmesi (kargo sonrası ödeme tuzağı)',
  'Yalnızca eski veya tanımsız bir kargo şirketi adı verilmesi',
  'İletişimi hızla WhatsApp\'a taşımak istenmesi',
  'Fiyatın son anda değiştirilmesi',
  'Profil fotoğrafı ve ilanı uyuşmayan hesap',
]

export default function GuvenliIslemPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16">
      <div className="flex items-center gap-3 mb-2">
        <ShieldCheck className="h-7 w-7 text-primary" />
        <h1 className="text-3xl font-bold text-gray-900">Güvenli İşlem Rehberi</h1>
      </div>
      <p className="text-sm text-gray-400 mb-2">Son güncelleme: Haziran 2026</p>
      <p className="text-gray-500 text-sm mb-10 leading-relaxed">
        Poketopu bir ilan ve eşleşme platformudur. Tüm alım-satım işlemleri kullanıcılar arasında doğrudan gerçekleşir.
        Platform ödeme veya kargo güvencesi sunmaz. Bu rehber doğru bilgiyle kendinizi korumanız için hazırlandı.
      </p>

      <div className="space-y-8">
        {SECTIONS.map(({ icon, title, items }) => (
          <section key={title} className="bg-white border border-gray-100 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              {icon}
              <h2 className="text-base font-semibold text-gray-900">{title}</h2>
            </div>
            <ul className="space-y-2">
              {items.map(item => (
                <li key={item} className="flex gap-2 text-sm text-gray-600 leading-relaxed">
                  <span className="text-gray-300 mt-0.5 flex-shrink-0">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>
        ))}

        {/* Kırmızı bayraklar */}
        <section className="bg-red-50 border border-red-100 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <h2 className="text-base font-semibold text-red-800">Dikkat: Bunları görürseniz duraksayın</h2>
          </div>
          <ul className="space-y-2">
            {RED_FLAGS.map(flag => (
              <li key={flag} className="flex gap-2 text-sm text-red-700 leading-relaxed">
                <span className="flex-shrink-0 mt-0.5">⚠</span>
                {flag}
              </li>
            ))}
          </ul>
        </section>

        {/* Sorumluluk reddi */}
        <div className="text-xs text-gray-400 leading-relaxed border-t border-gray-100 pt-6">
          Poketopu; kullanıcılar arasındaki işlemlerde arabulucu, garanti eden veya taraf olan bir kuruluş değildir.
          Ödeme, kargo, teslimat ve kart özgünlüğü konusundaki anlaşmazlıklar tamamen taraflar arasında çözülmelidir.
          Daha fazlası için{' '}
          <Link href="/kullanim-kosullari" className="underline hover:text-gray-600">Kullanım Koşulları</Link>
          {' '}sayfasını inceleyin.
        </div>
      </div>
    </div>
  )
}
