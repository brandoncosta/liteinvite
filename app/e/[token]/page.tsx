import { supabaseServer } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import InviteCard from '@/components/InviteCard';
import RsvpForm from './RsvpForm';
import { directionsUrl, embedMapSrc } from '@/lib/maps';

// See the matching comment in app/dashboard/[editToken]/page.tsx — without
// this, Next.js can cache the Supabase fetch and keep serving a stale
// version of the event/guest data on this page too.
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

  const dateLabel = new Date(event.event_date).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <main style={{ maxWidth: 480, margin: '0 auto', padding: '3rem 1.25rem' }}>
      <InviteCard
        theme={event.theme}
        template={event.template}
        purpose={event.purpose}
        title={event.title}
        subtitle={dateLabel}
        customHeadline={event.custom_headline}
        partner1={event.partner1}
        partner2={event.partner2}
        photoUrl={event.photo_url}
        paperTexture={event.paper_texture}
      />

      {event.description && <p style={{ marginTop: 20 }}>{event.description}</p>}
      {event.location && (
        <>
          <p className="muted" style={{ marginTop: -8 }}>
            {event.location}{' '}
            <a href={directionsUrl(event.location, event.map_query)} target="_blank" rel="noopener noreferrer">
              Get directions →
            </a>
          </p>
          {embedMapSrc(event.location, event.map_query) && (
            <div style={{ marginTop: 12, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
              <iframe
                src={embedMapSrc(event.location, event.map_query)!}
                width="100%"
                height="220"
                style={{ border: 0, display: 'block' }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          )}
        </>
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
