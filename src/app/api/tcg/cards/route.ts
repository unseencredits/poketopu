import { searchCards } from '@/lib/pokemon-tcg'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') ?? ''
  const setId = searchParams.get('set_id') ?? undefined
  if (!q.trim()) return Response.json({ data: [], totalCount: 0 })

  const { data, totalCount } = await searchCards(q.trim(), 1, setId || undefined)
  return Response.json({ data, totalCount })
}
