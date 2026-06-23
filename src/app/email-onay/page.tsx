import Link from 'next/link'
import Image from 'next/image'
import { CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'E-posta Onaylandı' }

export default function EmailOnayPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm text-center">
        <Link href="/">
          <Image src="/logo-colored.svg" alt="Poketopu" width={140} height={33} className="h-8 w-auto mx-auto mb-10" />
        </Link>

        <div className="h-16 w-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-8 w-8 text-emerald-500" />
        </div>

        <h1 className="text-xl font-bold text-gray-900 mb-3">E-posta onaylandı!</h1>
        <p className="text-sm text-gray-500 leading-relaxed mb-8">
          Hesabın aktifleşti. Giriş yaparak ilanları keşfedebilir, takas yapabilir ve ilan verebilirsin.
        </p>

        <Link href="/giris">
          <Button className="w-full h-11 bg-primary hover:bg-primary/90 text-white rounded-xl">
            Giriş Yap
          </Button>
        </Link>

        <Link href="/" className="block mt-4 text-sm text-gray-400 hover:text-gray-600 transition-colors">
          Önce biraz gez →
        </Link>
      </div>
    </div>
  )
}
