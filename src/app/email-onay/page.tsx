import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Hoş Geldin!' }

export default function EmailOnayPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm text-center">
        <Link href="/">
          <Image src="/logo-colored.svg" alt="Poketopu" width={140} height={33} className="h-8 w-auto mx-auto mb-10" />
        </Link>

        <div className="text-5xl mb-6">🎉</div>

        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          Hoş geldin, koleksiyoncu!
        </h1>
        <p className="text-base text-gray-500 leading-relaxed mb-2">
          E-posta adresin onaylandı. Artık ilanları keşfedebilir, takas yapabilir ve kendi ilanlarını verebilirsin.
        </p>
        <p className="text-sm text-gray-400 leading-relaxed mb-8">
          Tadını çıkar! ✨
        </p>

        {/* Beta mesajı */}
        <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 mb-8 text-left">
          <p className="text-xs font-semibold text-primary mb-1">Beta sürecindeyiz</p>
          <p className="text-xs text-gray-500 leading-relaxed">
            Poketopu şu an beta aşamasında. Her geri bildirim platformu şekillendiriyor.
            Bir şey eksik mi? Garip mi davranıyor? Söylemekten çekinme!
          </p>
        </div>

        <Link href="/">
          <Button className="w-full h-11 bg-primary hover:bg-primary/90 text-white rounded-xl mb-3">
            İlanları Keşfet
          </Button>
        </Link>

        <Link href="/ilan-ver" className="block text-sm text-gray-400 hover:text-gray-600 transition-colors">
          İlan vermek istiyorum →
        </Link>
      </div>
    </div>
  )
}
