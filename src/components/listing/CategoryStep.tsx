'use client'

import { useRouter } from 'next/navigation'
import { type Category, CATEGORIES } from '@/types'
import { CreditCard, Package, Star, Layers, ArrowRightLeft } from 'lucide-react'

const ICONS: Record<Category, React.ReactNode> = {
  card:       <CreditCard className="h-6 w-6" />,
  sealed:     <Package className="h-6 w-6" />,
  graded:     <Star className="h-6 w-6" />,
  accessory:  <Layers className="h-6 w-6" />,
}

const DESCRIPTIONS: Record<Category, string> = {
  card:      'Tekli Pokemon kartı',
  sealed:    'Booster pack, box, deck seti',
  graded:    'PSA, BGS, CGC derecelendirilmiş kart',
  accessory: 'Sleeve, binder, playmat, enerji vs.',
}

interface Props {
  onSelect: (cat: Category) => void
}

export default function CategoryStep({ onSelect }: Props) {
  const router = useRouter()

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Ne satmak istiyorsun?</h2>
      <p className="text-sm text-gray-500 mb-6">Ürün kategorini seç</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {(Object.keys(CATEGORIES) as Category[]).map((cat) => (
          <button
            key={cat}
            onClick={() => onSelect(cat)}
            className="flex items-start gap-4 p-5 rounded-2xl border border-gray-100 bg-white text-left hover:border-primary/40 hover:bg-red-50/30 transition-all group"
          >
            <div className="flex-shrink-0 mt-0.5 h-11 w-11 rounded-xl bg-gray-50 group-hover:bg-red-100 flex items-center justify-center text-gray-400 group-hover:text-primary transition-colors">
              {ICONS[cat]}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{CATEGORIES[cat]}</p>
              <p className="text-sm text-gray-500 mt-0.5">{DESCRIPTIONS[cat]}</p>
            </div>
          </button>
        ))}

        {/* Takas seçeneği */}
        <button
          onClick={() => router.push('/takas-ver')}
          className="flex items-start gap-4 p-5 rounded-2xl border border-gray-100 bg-white text-left hover:border-primary/40 hover:bg-red-50/30 transition-all group sm:col-span-2"
        >
          <div className="flex-shrink-0 mt-0.5 h-11 w-11 rounded-xl bg-gray-50 group-hover:bg-red-100 flex items-center justify-center text-gray-400 group-hover:text-primary transition-colors">
            <ArrowRightLeft className="h-6 w-6" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">Takas</p>
            <p className="text-sm text-gray-500 mt-0.5">Elimdeki kartı ver, aradığını bul — parasal işlem yok</p>
          </div>
        </button>
      </div>
    </div>
  )
}
