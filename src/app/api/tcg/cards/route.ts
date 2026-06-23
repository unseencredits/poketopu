import { unstable_cache } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { searchCards } from '@/lib/pokemon-tcg'
import type { TCGCard } from '@/lib/pokemon-tcg'

// TCG API sonuçlarını önbellekle — aynı sorgu 1 saat geçerli
const cachedSearchCards = unstable_cache(
  async (q: string, setId?: string) => searchCards(q, 1, setId),
  ['tcg-cards-search'],
  { revalidate: 3600 },
)

type LocalProduct = {
  id: string; name: string; number: string | null; rarity: string | null
  supertype: string | null; subtypes: string[] | null; types: string[] | null
  hp: string | null; image_url: string | null; image_url_hires: string | null
  set_id: string | null; set_name: string | null; series: string | null
}

function toTCGCard(p: LocalProduct): TCGCard {
  return {
    id: p.id,
    name: p.name,
    number: p.number ?? '',
    rarity: p.rarity,
    supertype: p.supertype ?? 'Pokémon',
    subtypes: p.subtypes,
    types: p.types,
    hp: p.hp,
    images: { small: p.image_url ?? '', large: p.image_url_hires ?? p.image_url ?? '' },
    set: { id: p.set_id ?? '', name: p.set_name ?? '', series: p.series ?? '', total: 0 },
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') ?? ''
  const setId = searchParams.get('set_id') ?? undefined

  if (!q.trim() && !setId) return Response.json({ data: [], totalCount: 0 })

  // 1. Metin sorgusu varsa önce yerel products tablosuna bak (çok hızlı)
  if (q.trim()) {
    const supabase = await createClient()
    const words = q.trim().split(/\s+/).filter(Boolean)

    let localQ = supabase
      .from('products')
      .select('id,name,set_id,set_name,series,number,rarity,image_url,image_url_hires,types,supertype,subtypes,hp')
      .order('name')
      .limit(24)

    // Her kelime hem isim hem numara alanında aransın (AND mantığı)
    for (const word of words) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      localQ = (localQ as any).or(`name.ilike.%${word}%,number.ilike.%${word}%`)
    }
    if (setId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      localQ = (localQ as any).eq('set_id', setId)
    }

    const { data: local } = await localQ
    if (local && local.length >= 4) {
      const cards = (local as LocalProduct[]).map(toTCGCard)
      return Response.json({ data: cards, totalCount: cards.length })
    }
  }

  // 2. Yerel sonuç yetersiz → TCG API (önbellekli, aynı sorgu tekrar hızlı gelir)
  const { data, totalCount } = await cachedSearchCards(q.trim(), setId || undefined)
  return Response.json({ data, totalCount })
}
