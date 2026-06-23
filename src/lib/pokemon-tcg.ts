const BASE = 'https://api.pokemontcg.io/v2'

function tcgHeaders(): HeadersInit {
  const key = process.env.POKEMON_TCG_API_KEY
  return key ? { 'X-Api-Key': key } : {}
}

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

  // "X/Y" formatı varsa: set.printedTotal ile tam eşleşme
  // "19/68" → number:19 set.printedTotal:68 → tam olarak o set + numara
  // "pikachu 19/68" veya "pikachu hidden fates 19/68" da aynı mantıkla çalışır
  const slashMatch = trimmed.match(/\b(\d{1,4})\/(\d+)\b/)
  if (slashMatch) {
    const num = slashMatch[1].replace(/^0+/, '') || '0'
    const total = slashMatch[2]
    return `number:${num} set.printedTotal:${total}`
  }

  // Sadece numara (toplam olmadan): "19", "SV001"
  if (/^[A-Za-z]{0,3}\d{1,4}$/.test(trimmed)) {
    const num = trimmed.replace(/^0+/, '') || '0'
    return `number:${num}`
  }

  // Ad + numara: "pikachu 25", "charizard ex 4"
  const m = trimmed.match(/^(.+?)\s+([A-Za-z]{0,3}\d{1,4})$/)
  if (m) {
    const textPart = m[1].trim()
    const num = m[2].replace(/^0+/, '') || '0'
    const wordCount = textPart.split(/\s+/).length
    if (wordCount <= 2) {
      return `name:"${textPart}*" number:${num}`
    }
    return `number:${num}`
  }

  return `name:"${trimmed}*"`
}

export async function searchCards(
  query: string,
  page = 1,
  setId?: string,
): Promise<{ data: TCGCard[]; totalCount: number }> {
  const trimmed = query.trim()
  let q: string

  if (!trimmed || trimmed === '*') {
    // Set tarama modu: metin sorgusu yok, sadece sete göre filtrele
    q = setId ? `set.id:${setId}` : 'name:*'
  } else {
    q = buildSearchQuery(trimmed)
    if (setId) q += ` set.id:${setId}`
  }

  const encoded = encodeURIComponent(q)
  // Set taramasında tüm kartları çek (max 250), normal aramada daha az
  const pageSize = setId && (!trimmed || trimmed === '*') ? 250 : setId ? 30 : 24
  const res = await fetch(
    `${BASE}/cards?q=${encoded}&page=${page}&pageSize=${pageSize}&orderBy=number&select=id,name,number,rarity,supertype,subtypes,types,hp,images,set`,
    { next: { revalidate: 3600 }, headers: tcgHeaders() }
  )
  if (!res.ok) return { data: [], totalCount: 0 }
  const json = await res.json()
  return { data: json.data ?? [], totalCount: json.totalCount ?? 0 }
}

export async function getCard(id: string): Promise<TCGCard | null> {
  const res = await fetch(`${BASE}/cards/${id}`, { next: { revalidate: 86400 }, headers: tcgHeaders() })
  if (!res.ok) return null
  const json = await res.json()
  return json.data ?? null
}

export async function getSets(): Promise<TCGSet[]> {
  const res = await fetch(
    `${BASE}/sets?select=id,name,series,total,releaseDate,images&orderBy=-releaseDate`,
    { next: { revalidate: 86400 }, headers: tcgHeaders() }
  )
  if (!res.ok) return []
  const json = await res.json()
  return json.data ?? []
}
