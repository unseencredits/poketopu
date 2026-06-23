import Link from 'next/link'
import Image from 'next/image'
import { Mail } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'E-postanı Onayla' }

export default function KayitBasariliPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm text-center">
        <Link href="/">
          <Image src="/logo-colored.svg" alt="Poketopu" width={140} height={33} className="h-8 w-auto mx-auto mb-10" />
        </Link>

        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Mail className="h-8 w-8 text-primary" />
        </div>

        <h1 className="text-xl font-bold text-gray-900 mb-3">E-postanı onayla</h1>
        <p className="text-sm text-gray-500 leading-relaxed mb-2">
          Sana bir onay bağlantısı gönderdik.
        </p>
        <p className="text-sm text-gray-500 leading-relaxed mb-8">
          E-postanı aç, gelen mesajdaki <strong className="text-gray-700">E-postamı Onayla</strong> butonuna tıkla. Spam klasörünü de kontrol etmeyi unutma.
        </p>

        <div className="bg-gray-50 rounded-2xl p-4 text-left text-xs text-gray-500 leading-relaxed">
          <p className="font-medium text-gray-700 mb-1">Gönderen adres:</p>
          <p>noreply@poketopu.com</p>
        </div>

        <p className="text-xs text-gray-400 mt-8">
          Zaten hesabın var mı?{' '}
          <Link href="/giris" className="text-primary hover:underline">Giriş yap</Link>
        </p>
      </div>
    </div>
  )
}
