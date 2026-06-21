import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import ScrollToTop from '@/components/layout/ScrollToTop'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: "poketopu — Türkiye'nin TCG Pazaryeri",
  description: "Pokemon kartları, sealed ürünler ve aksesuarlar için Türkiye'nin en büyük ikinci el pazaryeri.",
  keywords: 'pokemon kart, tcg, trading card, ikinci el, pokemon türkiye',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr">
      <body className={`${geist.className} bg-white text-gray-900 antialiased`}>
        <ScrollToTop />
        <Header />
        <main className="min-h-screen">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}
