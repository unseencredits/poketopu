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
  set: { id: string; name: string; series: string; total: number }
}

export interface TCGSet {
  id: string
  name: string
  series: string
  total: number
  releaseDate: string
  images: { symbol: string; logo: string }
}

function buildSearchQuery(q: string): string {
  const trimmed = q.trim()

  // Sadece numara: "19", "019/68", "SV001", "TG01"
  if (/^[A-Za-z]{0,3}\d{1,4}(\/\d+)?$/.test(trimmed)) {
    const num = trimmed.split('/')[0].replace(/^0+/, '') || '0'
    return `number:${num}`
  }

  // Ad + numara: "pikachu 19", "charizard 4/102", "pikachu hidden fates 19/68"
  // → son token numara ise onu ayır, kalanı ad olarak ara
  const m = trimmed.match(/^(.+?)\s+([A-Za-z]{0,3}\d{1,4}(?:\/\d+)?)$/)
  if (m) {
    const namePart = m[1].trim()
    const num = m[2].split('/')[0].replace(/^0+/, '') || '0'
    // Sadece ilk kelimeyi kart adı olarak kullan (set adını ad kısmından çıkar)
    const firstWord = namePart.split(/\s+/)[0]
    return `name:"${firstWord}*" number:${num}`
  }

  return `name:"${trimmed}*"`
}

export async function searchCards(
  query: string,
  page = 1,
  setId?: string,
): Promise<{ data: TCGCard[]; totalCount: number }> {
  let q = buildSearchQuery(query)
  if (setId) q += ` set.id:${setId}`
  const encoded = encodeURIComponent(q)
  // Set seçiliyken daha fazla sonuç getir (set içindeki sayı az)
  const pageSize = setId ? 20 : 12
  const res = await fetch(
    `${BASE}/cards?q=${encoded}&page=${page}&pageSize=${pageSize}&select=id,name,number,rarity,supertype,subtypes,types,hp,images,set`,
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

export async function getSets(): Promise<TCGSet[]> {
  const res = await fetch(
    `${BASE}/sets?select=id,name,series,total,releaseDate,images&orderBy=-releaseDate`,
    { next: { revalidate: 86400 } }
  )
  if (!res.ok) return []
  const json = await res.json()
  return json.data ?? []
}
