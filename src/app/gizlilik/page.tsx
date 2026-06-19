export default function GizlilikPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Gizlilik Politikası</h1>
      <p className="text-sm text-gray-400 mb-10">Son güncelleme: Haziran 2026</p>

      <div className="space-y-8 text-gray-600 leading-relaxed text-sm">
        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">Topladığımız Bilgiler</h2>
          <p>Hesap oluştururken e-posta adresiniz ve kullanıcı adınızı alıyoruz. İlan verdiğinizde kart bilgisi, fiyat ve fotoğraflarınız kaydedilir. Mesajlaşma içerikleriniz yalnızca ilgili taraflarca görülebilir.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">Bilgilerinizi Nasıl Kullanıyoruz</h2>
          <p>Verileriniz yalnızca platformun işleyişi için kullanılır: hesabınızın yönetimi, ilanlarınızın gösterimi ve kullanıcılar arası mesajlaşma. Verilerinizi üçüncü taraflarla satmıyor ya da paylaşmıyoruz.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">Çerezler</h2>
          <p>Oturum yönetimi için zorunlu çerezler kullanıyoruz. Reklamcılık veya izleme amaçlı üçüncü taraf çerezi kullanmıyoruz.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">Veri Güvenliği</h2>
          <p>Verileriniz Supabase altyapısında, şifreli bağlantılar üzerinden saklanmaktadır. Şifreler hiçbir zaman düz metin olarak tutulmaz.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">Hesap Silme</h2>
          <p>Hesabınızı ve verilerinizi silmek için <a href="mailto:destek@poketopu.com" className="text-red-500 hover:underline">destek@poketopu.com</a> adresine yazabilirsiniz.</p>
        </section>
      </div>
    </div>
  )
}
