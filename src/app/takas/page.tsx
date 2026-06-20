import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import TakasClient from './TakasClient'
import type { Trade, UserTradePreview } from '@/types'

interface Props {
  searchParams: Promise<Record<string, string>>
}

async function getUserPreviews(type: 'have' | 'want'): Promise<UserTradePreview[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('trades')
    .select('user_id, photos, product:products(id,name,image_url), profile:profiles(id,username,avatar_url)')
    .eq('status', 'active')
    .eq('type', type)
    .order('created_at', { ascending: false })
    .limit(400)

  const trades = (data as unknown as Trade[]) ?? []

  // Kullanıcı bazında grupla
  const map = new Map<string, UserTradePreview>()
  for (const trade of trades) {
    if (!trade.profile) continue
    if (!map.has(trade.user_id)) {
      map.set(trade.user_id, {
        userId: trade.user_id,
        profile: trade.profile,
        cardImages: [],
        count: 0,
      })
    }
    const entry = map.get(trade.user_id)!
    entry.count++
    const img = trade.photos?.[0] ?? trade.product?.image_url ?? null
    if (img && entry.cardImages.length < 4) entry.cardImages.push(img)
  }

  return Array.from(map.values()).sort((a, b) => b.count - a.count)
}

export default async function TakasPage({ searchParams }: Props) {
  const sp = await searchParams
  const activeTab = (sp.tab === 'want' ? 'want' : 'have') as 'have' | 'want'

  const users = await getUserPreviews(activeTab)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Takas</h1>
          <p className="text-sm text-gray-400 mt-0.5">Diğer üyelerle kart takası yap</p>
        </div>
        <Link href="/takas-ver">
          <Button className="bg-primary hover:bg-primary/90 text-white rounded-xl gap-1.5">
            <Plus className="h-4 w-4" />
            Takas İlanı Ver
          </Button>
        </Link>
      </div>

      <TakasClient users={users} activeTab={activeTab} />
    </div>
  )
}
