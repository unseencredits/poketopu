import { getSets } from '@/lib/pokemon-tcg'

// Set listesi nadiren değişir — 24 saat cache
export const revalidate = 86400

export async function GET() {
  const sets = await getSets()
  return Response.json(sets)
}
