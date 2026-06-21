import { createClient } from '@/lib/supabase/server'
import { MapPin, Calendar, Users, Trophy, Clock } from 'lucide-react'
import EtkinlikForm from './EtkinlikForm'

interface Event {
  id: string
  title: string
  description: string | null
  location: string | null
  city: string | null
  event_date: string
  format: string | null
  max_participants: number | null
  entry_fee: number | null
  prize_info: string | null
  status: string
  created_at: string
  organizer: { username: string } | null
}

export default async function TurnuvaPage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('events')
    .select('*, organizer:profiles(username)')
    .neq('status', 'cancelled')
    .order('event_date', { ascending: true })
    .limit(50)

  const events = (data ?? []) as unknown as Event[]
  const now = new Date()

  const upcoming = events.filter(e => new Date(e.event_date) >= now)
  const past = events.filter(e => new Date(e.event_date) < now)

  function EventCard({ event }: { event: Event }) {
    const date = new Date(event.event_date)
    const isPast = date < now
    const dateStr = date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
    const timeStr = date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })

    return (
      <div className={`bg-white rounded-2xl border p-5 transition-all ${isPast ? 'border-gray-100 opacity-70' : 'border-gray-100 hover:border-gray-200 hover:shadow-sm'}`}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 leading-snug">{event.title}</h3>
            {event.format && (
              <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary mt-1">
                {event.format}
              </span>
            )}
          </div>
          {isPast && (
            <span className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Geçmiş</span>
          )}
        </div>

        <div className="space-y-1.5 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
            <span>{dateStr}</span>
            <span className="flex items-center gap-1 text-gray-400">
              <Clock className="h-3 w-3" /> {timeStr}
            </span>
          </div>

          {(event.city || event.location) && (
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
              <span className="truncate">
                {[event.city, event.location].filter(Boolean).join(' — ')}
              </span>
            </div>
          )}

          {event.max_participants && (
            <div className="flex items-center gap-2">
              <Users className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
              <span>Maks. {event.max_participants} kişi</span>
            </div>
          )}

          {event.prize_info && (
            <div className="flex items-center gap-2">
              <Trophy className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
              <span className="truncate">{event.prize_info}</span>
            </div>
          )}
        </div>

        {event.description && (
          <p className="mt-3 text-sm text-gray-500 leading-relaxed line-clamp-2">{event.description}</p>
        )}

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
          <span className="text-xs text-gray-400">
            @{event.organizer?.username ?? 'anonim'} tarafından
          </span>
          {event.entry_fee != null ? (
            <span className="text-sm font-bold text-gray-900">{event.entry_fee.toLocaleString('tr-TR')} ₺</span>
          ) : (
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Ücretsiz</span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Turnuva & Etkinlikler</h1>
          <p className="text-sm text-gray-400 mt-0.5">Türkiye genelindeki Pokémon TCG etkinlikleri</p>
        </div>
        <EtkinlikForm />
      </div>

      {events.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 p-16 text-center">
          <Trophy className="h-8 w-8 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400 mb-3">Henüz etkinlik yok.</p>
          <p className="text-xs text-gray-400">Bir turnuva organize ediyorsan yukarıdan ekleyebilirsin.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {upcoming.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                Yaklaşan Etkinlikler
                <span className="ml-2 text-primary">{upcoming.length}</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {upcoming.map(e => <EventCard key={e.id} event={e} />)}
              </div>
            </section>
          )}

          {past.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                Geçmiş Etkinlikler
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {past.map(e => <EventCard key={e.id} event={e} />)}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
