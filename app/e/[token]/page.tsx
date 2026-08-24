import { supabaseServer } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import InviteCard from '@/components/InviteCard';
import RsvpForm from './RsvpForm';
import { googleMapsUrl } from '@/lib/maps';

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
        title={event.title}
        subtitle={dateLabel}
        photoUrl={event.photo_url}
        textureUrl={event.texture_url}
      />

      {event.description && <p style={{ marginTop: 20 }}>{event.description}</p>}
      {event.location && (
        <p className="muted" style={{ marginTop: -8 }}>
          {event.location}{' '}
          <a href={googleMapsUrl(event.location)} target="_blank" rel="noopener noreferrer">
            View on Google Maps →
          </a>
        </p>
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
