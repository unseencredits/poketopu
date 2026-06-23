import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import ScrollToTop from '@/components/layout/ScrollToTop'
import CookieBanner from '@/components/layout/CookieBanner'
import ConditionalAnalytics from '@/components/layout/ConditionalAnalytics'
import FeedbackButton from '@/components/shared/FeedbackButton'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: "Poketopu | Türkiye'nin Pokémon TCG Pazaryeri",
    template: '%s | Poketopu',
  },
  description: "Pokémon TCG kartlarını alın, satın veya takas edin. Türkiye'nin ilk koleksiyoncu platformu. Ücretsiz ilan verin.",
  keywords: ['pokemon kart', 'pokémon tcg', 'pokemon türkiye', 'tcg pazaryeri', 'pokemon kart satış', 'pokemon kart takas', 'pokemon ikinci el', 'koleksiyoncu'],
  metadataBase: new URL('https://poketopu.com'),
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    url: 'https://poketopu.com',
    siteName: 'Poketopu',
    title: "Poketopu | Türkiye'nin Pokémon TCG Pazaryeri",
    description: "Pokémon TCG kartlarını alın, satın veya takas edin. Türkiye'nin ilk koleksiyoncu platformu.",
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Poketopu — Türkiye Pokémon TCG Pazaryeri' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Poketopu | Türkiye'nin Pokémon TCG Pazaryeri",
    description: "Pokémon TCG kartlarını alın, satın veya takas edin. Türkiye'nin ilk koleksiyoncu platformu.",
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  alternates: { canonical: 'https://poketopu.com' },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr" data-scroll-behavior="smooth">
      <body className={`${geist.className} bg-white text-gray-900 antialiased`}>
        <ScrollToTop />
        <Header />
        <main className="min-h-screen">
          {children}
        </main>
        <Footer />
        <FeedbackButton />
        <CookieBanner />
        <ConditionalAnalytics />
      </body>
    </html>
  )
}
