'use server'

type ModerationInput =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } }

const CATEGORY_LABELS: Record<string, string> = {
  hate: 'Nefret içeriği',
  'hate/threatening': 'Tehdit içeriği',
  harassment: 'Taciz içeriği',
  'harassment/threatening': 'Tehdit içeriği',
  sexual: 'Cinsel içerik',
  'sexual/minors': 'Uygunsuz içerik',
  violence: 'Şiddet içeriği',
  'violence/graphic': 'Şiddet içeriği',
  illicit: 'Yasadışı içerik',
  'illicit/violent': 'Yasadışı içerik',
}

export async function checkModeration(
  texts: string[],
  imageUrls: string[],
): Promise<{ flagged: boolean; reason: string | null }> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return { flagged: false, reason: null }

  const input: ModerationInput[] = [
    ...texts
      .map(t => t.trim())
      .filter(Boolean)
      .map(text => ({ type: 'text' as const, text })),
    ...imageUrls
      .filter(Boolean)
      .map(url => ({ type: 'image_url' as const, image_url: { url } })),
  ]

  if (input.length === 0) return { flagged: false, reason: null }

  try {
    const res = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: 'omni-moderation-latest', input }),
    })

    if (!res.ok) return { flagged: false, reason: null }

    const json = await res.json() as {
      results: Array<{
        flagged: boolean
        categories: Record<string, boolean>
      }>
    }

    const flaggedResult = json.results?.find(r => r.flagged)
    if (!flaggedResult) return { flagged: false, reason: null }

    const flaggedCategory = Object.entries(flaggedResult.categories)
      .find(([, v]) => v === true)?.[0]

    return {
      flagged: true,
      reason: flaggedCategory ? (CATEGORY_LABELS[flaggedCategory] ?? 'Uygunsuz içerik') : 'Uygunsuz içerik',
    }
  } catch {
    // API hatası ilan yayınını engellemesin
    return { flagged: false, reason: null }
  }
}
