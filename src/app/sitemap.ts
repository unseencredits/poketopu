import { MetadataRoute } from 'next'

const BASE = 'https://poketopu.com'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE,                         lastModified: new Date(), changeFrequency: 'daily',   priority: 1.0 },
    { url: `${BASE}/ara`,                lastModified: new Date(), changeFrequency: 'hourly',  priority: 0.9 },
    { url: `${BASE}/kartlar`,            lastModified: new Date(), changeFrequency: 'daily',   priority: 0.8 },
    { url: `${BASE}/ilan-ver`,           lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/takas`,              lastModified: new Date(), changeFrequency: 'daily',   priority: 0.7 },
    { url: `${BASE}/etkinlikler`,        lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.6 },
    { url: `${BASE}/kayit`,              lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/giris`,              lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/guvenli-islem`,      lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/hakkimizda`,         lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE}/iletisim`,           lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE}/kullanim-kosullari`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.2 },
    { url: `${BASE}/gizlilik`,           lastModified: new Date(), changeFrequency: 'monthly', priority: 0.2 },
  ]
}
