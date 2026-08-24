import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { view_token, name, email, status, plus_ones, note, guest_token } = body;

  if (!view_token || !name || !status) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  if (!['yes', 'no', 'maybe'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const supabase = supabaseServer();

  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id')
    .eq('view_token', view_token)
    .single();

  if (eventError || !event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  // If this link carries a guest_token (they clicked a personal invite),
  // trust that over name/email matching — it's an exact identity, and
  // covers the case where they changed their name/email on the form.
  let guest: { id: string; rsvp_id: string | null } | null = null;
  if (guest_token) {
    const { data } = await supabase
      .from('guests')
      .select('id, rsvp_id')
      .eq('event_id', event.id)
      .eq('invite_token', guest_token)
      .maybeSingle();
    guest = data;
  }

  let existingId: string | null = guest?.rsvp_id || null;
  if (!existingId) {
    // Fall back to matching by name + email on this event, for guests who
    // arrived via the plain shared link rather than a personal invite.
    let existingQuery = supabase
      .from('rsvps')
      .select('id')
      .eq('event_id', event.id)
      .eq('name', name);
    existingQuery = email ? existingQuery.eq('email', email) : existingQuery.is('email', null);
    const { data: existing } = await existingQuery.maybeSingle();
    existingId = existing?.id || null;
  }

  const payload = {
    event_id: event.id,
    name,
    email: email || null,
    status,
    plus_ones: plus_ones || 0,
    note: note || null,
    updated_at: new Date().toISOString(),
  };

  const { data: saved, error } = existingId
    ? await supabase.from('rsvps').update(payload).eq('id', existingId).select('id').single()
    : await supabase.from('rsvps').insert(payload).select('id').single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (guest && saved) {
    await supabase.from('guests').update({ rsvp_id: saved.id }).eq('id', guest.id);
  }

  return NextResponse.json({ ok: true });
}
