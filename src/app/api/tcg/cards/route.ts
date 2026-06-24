// Kart arama — Supabase products tablosunu sorgular (dış API yok).
// Import yapıldıktan sonra tüm ~20K kart yerel DB'de olur: hızlı ve eksiksiz.

import { createClient } from '@/lib/supabase/server'
import type { TCGCard } from '@/lib/pokemon-tcg'

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

  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = supabase
    .from('products')
    .select('id,name,set_id,set_name,series,number,rarity,image_url,image_url_hires,types,supertype,subtypes,hp')
    .limit(100)

  if (q.trim()) {
    const words = q.trim().split(/\s+/).filter(Boolean)
    for (const word of words) {
      // "19/68" formatında numarayı "19" olarak da ara
      const numBase = /^\d{1,4}\/\d+$/.test(word) ? word.split('/')[0] : word
      query = query.or(`name.ilike.%${word}%,number.ilike.%${numBase}%`)
    }
  }

  if (setId) query = query.eq('set_id', setId)

  // Yeni setler (büyük ID ≈ yeni set) önce; aynı set içinde isme göre sırala
  query = query.order('set_id', { ascending: false }).order('name', { ascending: true })

  const { data } = await query
  const cards = ((data ?? []) as LocalProduct[]).map(toTCGCard)
  return Response.json({ data: cards, totalCount: cards.length })
}
