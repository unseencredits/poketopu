// Tüm Pokemon TCG kartlarını GitHub JSON'dan Supabase'e import eder.
// Sadece is_admin=true olan oturumdaki kullanıcılar erişebilir.
// Admin panelindeki "Kart Verilerini İçe Aktar" butonu tarafından çağrılır.

export const maxDuration = 300

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const GITHUB_BASE =
  'https://raw.githubusercontent.com/PokemonTCG/pokemon-tcg-data/master'

interface GithubSet {
  id: string
  name: string
  series: string
  total: number
  releaseDate: string
}

interface GithubCard {
  id: string
  name: string
  number: string
  rarity?: string
  supertype?: string
  subtypes?: string[]
  types?: string[]
  hp?: string
  images?: { small?: string; large?: string }
  set?: { id: string; name: string; series: string; total: number }
}

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('profiles').select('is_admin').eq('id', user.id).single()
  return profile?.is_admin ? true : null
}

export async function GET() {
  const ok = await requireAdmin()
  if (!ok) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 1. Set listesini çek
  const setsRes = await fetch(`${GITHUB_BASE}/sets/en.json`, { cache: 'no-store' })
  if (!setsRes.ok) {
    return Response.json({ error: 'Sets fetch failed' }, { status: 502 })
  }
  const sets: GithubSet[] = await setsRes.json()

  // 2. Kart JSON'larını 20'li gruplar halinde paralel çek
  const CHUNK = 20
  const allCards: GithubCard[] = []

  for (let i = 0; i < sets.length; i += CHUNK) {
    const chunk = sets.slice(i, i + CHUNK)
    const results = await Promise.all(
      chunk.map(async (set) => {
        const res = await fetch(
          `${GITHUB_BASE}/cards/en/${set.id}.json`,
          { cache: 'no-store' },
        )
        if (!res.ok) return [] as GithubCard[]
        const cards = await res.json() as GithubCard[]
        // GitHub JSON'ındaki kartlarda set bilgisi olmayabilir;
        // set listesinden alarak her karta enjekte et
        return cards.map(c => ({
          ...c,
          set: { id: set.id, name: set.name, series: set.series, total: set.total },
        }))
      }),
    )
    allCards.push(...results.flat())
  }

  // 3. Supabase'e 500'lük partiler halinde upsert et
  const supabase = createAdminClient()
  const BATCH = 500
  let upserted = 0
  let failed = 0

  for (let i = 0; i < allCards.length; i += BATCH) {
    const rows = allCards.slice(i, i + BATCH).map((c) => ({
      id: c.id,
      name: c.name,
      set_id: c.set?.id ?? null,
      set_name: c.set?.name ?? null,
      series: c.set?.series ?? null,
      number: c.number ?? null,
      rarity: c.rarity ?? null,
      image_url: c.images?.small ?? null,
      image_url_hires: c.images?.large ?? null,
      types: c.types ?? null,
      supertype: c.supertype ?? null,
      subtypes: c.subtypes ?? null,
      hp: c.hp ?? null,
    }))

    const { error } = await supabase
      .from('products')
      .upsert(rows, { onConflict: 'id' })

    if (error) {
      console.error('Upsert batch error:', error.message)
      failed += rows.length
    } else {
      upserted += rows.length
    }
  }

  return Response.json({
    success: true,
    sets: sets.length,
    cards: allCards.length,
    upserted,
    failed,
  })
}
