export default function IletisimPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">İletişim</h1>
      <p className="text-sm text-gray-400 mb-10">Sorularınız için buradayız</p>

      <div className="space-y-6 text-gray-600">
        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">Genel Destek</h2>
          <p className="text-sm mb-2">İlan sorunları, hesap yardımı ve genel sorular için:</p>
          <a href="mailto:destek@poketopu.com" className="text-red-500 font-medium hover:underline">
            destek@poketopu.com
          </a>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">İş Birliği & Reklam</h2>
          <p className="text-sm mb-2">Marka iş birlikleri ve reklam için:</p>
          <a href="mailto:info@poketopu.com" className="text-red-500 font-medium hover:underline">
            info@poketopu.com
          </a>
        </div>

        <p className="text-xs text-gray-400">
          Beta sürecinde olduğumuz için yanıt sürelerimiz değişkenlik gösterebilir.
          En geç 2 iş günü içinde dönüş yapmaya çalışıyoruz.
        </p>
      </div>
    </div>
  )
}
