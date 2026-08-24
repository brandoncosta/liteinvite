import { supabaseServer } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import InviteCard from '@/components/InviteCard';
import RsvpForm from './RsvpForm';
import { directionsUrl, mapEmbed, destinationFor, geocode } from '@/lib/maps';

// Supabase queries are forced fresh at the client level (see lib/supabase.ts),
// and this keeps the page itself out of Next's full-route cache too.
export const dynamic = 'force-dynamic';

export default async function EventPage({
  params,
  searchParams,
}: {
  params: { token: string };
  searchParams: { g?: string };
}) {
  const supabase = supabaseServer();
  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('view_token', params.token)
    .single();

  if (!event) notFound();

  // ?g=<invite_token> means this guest clicked their personal invite link —
  // look them up so the form can prefill their name/email and their RSVP
  // links back to this guest row on the dashboard.
  const guestToken = searchParams.g;
  let guest: { name: string; email: string } | null = null;
  if (guestToken) {
    const { data } = await supabase
      .from('guests')
      .select('name, email')
      .eq('event_id', event.id)
      .eq('invite_token', guestToken)
      .maybeSingle();
    guest = data;
  }

  // Events created before the map feature (or whose geocode failed at
  // creation) get resolved once here, then cached back onto the row so
  // this only ever happens on the first view.
  let coords = { lat: event.map_lat as number | null, lng: event.map_lng as number | null };
  if (event.location && coords.lat == null) {
    const point = await geocode(destinationFor(event.location, event.map_query));
    if (point) {
      coords = point;
      await supabase.from('events').update({ map_lat: point.lat, map_lng: point.lng }).eq('id', event.id);
    }
  }
  const embed = event.location ? mapEmbed(event.location, event.map_query, coords) : null;

  return (
    <main style={{ maxWidth: 520, margin: '0 auto', padding: '3rem 1.25rem' }}>
      <InviteCard
        theme={event.theme}
        template={event.template}
        purpose={event.purpose}
        title={event.title}
        eventDate={event.event_date}
        location={event.location}
        customEyebrow={event.custom_eyebrow}
        customHeadline={event.custom_headline}
        partner1={event.partner1}
        partner2={event.partner2}
        honoree={event.honoree}
        closingLine={event.closing_line}
        photoUrl={event.photo_url}
        paperTexture={event.paper_texture}
      />

      {event.description && <p style={{ marginTop: 24 }}>{event.description}</p>}

      {event.location && (
        <section style={{ marginTop: 24 }}>
          {embed && (
            <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)' }}>
              <iframe
                src={embed.src}
                title={`Map showing ${event.location}`}
                width="100%"
                height="240"
                style={{ border: 0, display: 'block' }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          )}
          <p className="muted" style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <span>{event.location}</span>
            <a href={directionsUrl(event.location, event.map_query)} target="_blank" rel="noopener noreferrer">
              Get directions →
            </a>
          </p>
        </section>
      )}

      <div style={{ marginTop: 28 }}>
        <RsvpForm
          viewToken={event.view_token}
          guestToken={guestToken}
          prefillName={guest?.name}
          prefillEmail={guest?.email}
        />
      </div>
    </main>
  );
}
