export default function HakkimizdaPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Hakkımızda</h1>
      <p className="text-sm text-gray-400 mb-10">Beta sürümü</p>

      <div className="prose prose-gray max-w-none space-y-6 text-gray-600 leading-relaxed">
        <p>
          <strong className="text-gray-900">poketopu.com</strong>, Türkiye'deki Pokemon TCG koleksiyoncuları ve oyuncuları için
          geliştirilmiş bir alım-satım pazaryeridir.
        </p>
        <p>
          Amacımız basit: aynı kartı listeleyen farklı satıcıları tek bir sayfada göstererek
          alıcıların en iyi fiyatı ve koşulu kolayca bulmasını sağlamak.
        </p>
        <p>
          Platform şu an beta aşamasındadır. İlan vermek ve alışveriş yapmak tamamen ücretsizdir.
          Her ilan TCG standart koşul skalasıyla (NM → Damaged) değerlendirilmektedir.
        </p>
        <p>
          Geri bildirimlerinizi <a href="mailto:destek@poketopu.com" className="text-red-500 hover:underline">destek@poketopu.com</a> adresine iletebilirsiniz.
        </p>
      </div>
    </div>
  )
}
