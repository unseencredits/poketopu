import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import TakasClient from './TakasClient'
import type { Trade } from '@/types'

interface Props {
  searchParams: Promise<Record<string, string>>
}

async function getTrades(type: 'have' | 'want'): Promise<Trade[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('trades')
    .select('*, product:products(id,name,set_name,number,image_url), profile:profiles(id,username,avatar_url)')
    .eq('status', 'active')
    .eq('type', type)
    .order('created_at', { ascending: false })
    .limit(80)
  return (data as unknown as Trade[]) ?? []
}

export default async function TakasPage({ searchParams }: Props) {
  const sp = await searchParams
  const activeTab = (sp.tab === 'want' ? 'want' : 'have') as 'have' | 'want'
  const trades = await getTrades(activeTab)

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

      <TakasClient trades={trades} activeTab={activeTab} />
    </div>
  )
}
