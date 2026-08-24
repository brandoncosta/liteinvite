import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';

// Add guests to an event's invite list — from CSV import or the "add one"
// form on the dashboard. Dedupes by email (case-insensitive) against guests
// already on the list, so re-importing the same CSV twice is harmless.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { edit_token, guests } = body as {
      edit_token?: string;
      guests?: { name: string; email: string }[];
    };

    if (!edit_token || !Array.isArray(guests) || guests.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const cleaned = guests
      .map((g) => ({ name: (g.name || '').trim(), email: (g.email || '').trim().toLowerCase() }))
      .filter((g) => g.name && g.email && g.email.includes('@'));

    if (cleaned.length === 0) {
      return NextResponse.json({ error: 'No valid name+email rows found' }, { status: 400 });
    }

    const supabase = supabaseServer();
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id')
      .eq('edit_token', edit_token)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const { data: existing } = await supabase.from('guests').select('email').eq('event_id', event.id);
    const existingEmails = new Set((existing || []).map((g) => g.email.toLowerCase()));

    // De-dupe within the uploaded batch too (same address twice in one CSV).
    const seen = new Set<string>();
    const toInsert = cleaned.filter((g) => {
      if (existingEmails.has(g.email) || seen.has(g.email)) return false;
      seen.add(g.email);
      return true;
    });

    const skipped = cleaned.length - toInsert.length;

    if (toInsert.length === 0) {
      return NextResponse.json({ added: 0, skipped });
    }

    const { data, error } = await supabase
      .from('guests')
      .insert(toInsert.map((g) => ({ event_id: event.id, name: g.name, email: g.email })))
      .select('*');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ added: data?.length || 0, skipped, guests: data });
  } catch (err) {
    // Any unexpected throw here used to crash the route and hand the
    // client Next's HTML error page instead of JSON, which broke
    // `res.json()` on the client and left the UI stuck mid-action.
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unexpected server error adding guests' },
      { status: 500 }
    );
  }
}

// Remove a guest from the invite list (doesn't touch any RSVP they may
// have already submitted — that stays on the Guests tab).
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { edit_token, guest_id } = body as { edit_token?: string; guest_id?: string };

    if (!edit_token || !guest_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = supabaseServer();
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id')
      .eq('edit_token', edit_token)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const { error } = await supabase.from('guests').delete().eq('id', guest_id).eq('event_id', event.id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unexpected server error removing guest' },
      { status: 500 }
    );
  }
}
