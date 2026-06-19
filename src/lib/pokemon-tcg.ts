const BASE = 'https://api.pokemontcg.io/v2'

export interface TCGCard {
  id: string
  name: string
  number: string
  rarity: string | null
  supertype: string
  subtypes: string[] | null
  types: string[] | null
  hp: string | null
  images: { small: string; large: string }
  set: { id: string; name: string; series: string }
}

export async function searchCards(query: string, page = 1): Promise<{ data: TCGCard[]; totalCount: number }> {
  const q = encodeURIComponent(`name:"${query}*"`)
  const res = await fetch(
    `${BASE}/cards?q=${q}&page=${page}&pageSize=12&select=id,name,number,rarity,supertype,subtypes,types,hp,images,set`,
    { next: { revalidate: 3600 } }
  )
  if (!res.ok) return { data: [], totalCount: 0 }
  const json = await res.json()
  return { data: json.data ?? [], totalCount: json.totalCount ?? 0 }
}

export async function getCard(id: string): Promise<TCGCard | null> {
  const res = await fetch(`${BASE}/cards/${id}`, { next: { revalidate: 86400 } })
  if (!res.ok) return null
  const json = await res.json()
  return json.data ?? null
}
