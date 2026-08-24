import { supabaseServer } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import DashboardClient from './DashboardClient';

// Next.js caches the fetch calls Supabase's client makes under the hood
// unless a route is explicitly marked dynamic. Without this, the dashboard
// can keep serving a stale snapshot after a guest is added, an invite is
// sent, or an RSVP comes in — router.refresh() re-runs this page, but a
// cached fetch response means the "fresh" render still shows old data.
export const dynamic = 'force-dynamic';

export default async function DashboardPage({ params }: { params: { editToken: string } }) {
  const supabase = supabaseServer();
  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('edit_token', params.editToken)
    .single();

  if (!event) notFound();

  const { data: rsvps } = await supabase
    .from('rsvps')
    .select('*')
    .eq('event_id', event.id)
    .order('created_at', { ascending: true });

  const { data: guests } = await supabase
    .from('guests')
    .select('*')
    .eq('event_id', event.id)
    .order('created_at', { ascending: true });

  return <DashboardClient event={event} rsvps={rsvps || []} guests={guests || []} />;
}
