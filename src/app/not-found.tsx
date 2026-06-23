import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-20">
      <div className="text-center max-w-md">
        <p className="text-8xl font-black text-primary mb-2 tracking-tight">404</p>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          Bu sayfa kayboldu.
        </h1>
        <p className="text-gray-500 text-base mb-2">
          Sanırım Gengar götürdü.
        </p>
        <p className="text-gray-400 text-sm mb-8">
          Ya da linki yanlış yazdın. İkisi de mümkün.
        </p>
        <Link href="/">
          <Button className="bg-primary hover:bg-primary/90 text-white rounded-xl h-11 px-6 gap-2">
            <Home className="h-4 w-4" />
            Anasayfaya Dön
          </Button>
        </Link>
      </div>
    </div>
  )
}
