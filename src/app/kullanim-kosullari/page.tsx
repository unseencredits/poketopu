export default function KullanimKosullariPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Kullanım Koşulları</h1>
      <p className="text-sm text-gray-400 mb-10">Son güncelleme: Haziran 2026</p>

      <div className="space-y-8 text-gray-600 leading-relaxed text-sm">
        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">Genel</h2>
          <p>poketopu.com'u kullanarak aşağıdaki koşulları kabul etmiş sayılırsınız. Platform şu an beta aşamasındadır ve bu koşullar değişebilir.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">İlanlar ve Satışlar</h2>
          <ul className="list-disc pl-4 space-y-1">
            <li>Yalnızca gerçek, sizin mülkünüzde olan ürünleri listeleyebilirsiniz.</li>
            <li>İlan açıklamaları doğru ve yanıltıcı olmayan bilgi içermelidir.</li>
            <li>Kart koşulunu TCG standartlarına göre dürüstçe belirtmek zorundasınız.</li>
            <li>Alım-satım işlemi tamamen kullanıcılar arasında gerçekleşir; poketopu.com aracı değildir.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">Yasaklı İçerikler</h2>
          <ul className="list-disc pl-4 space-y-1">
            <li>Sahte, çalıntı veya lisanssız ürünler</li>
            <li>Yanıltıcı fiyatlandırma veya sahte stok bilgisi</li>
            <li>Spam, reklam veya uygunsuz içerik</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">Sorumluluk Sınırı</h2>
          <p>poketopu.com, kullanıcılar arasındaki alım-satım işlemlerinden doğan anlaşmazlıklarda taraf değildir ve sorumluluk kabul etmez. Alışverişlerinizde dikkatli olmanızı öneririz.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">İletişim</h2>
          <p>Sorularınız için: <a href="mailto:destek@poketopu.com" className="text-red-500 hover:underline">destek@poketopu.com</a></p>
        </section>
      </div>
    </div>
  )
}
