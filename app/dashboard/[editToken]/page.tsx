import { supabaseServer } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import DashboardClient from './DashboardClient';

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
