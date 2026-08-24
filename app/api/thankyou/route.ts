import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';
import { renderEmailHtml } from '@/lib/email';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// notes: { rsvp_id: string, note: string }[]
// Each guest gets the shared base message plus their own personalized note appended.
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { edit_token, subject, base_message, notes } = body;

  if (!edit_token || !subject || !notes || !Array.isArray(notes)) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const supabase = supabaseServer();
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id, title')
    .eq('edit_token', edit_token)
    .single();

  if (eventError || !event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  const ids = notes.map((n: { rsvp_id: string }) => n.rsvp_id);
  const { data: guests, error: guestsError } = await supabase
    .from('rsvps')
    .select('id, name, email')
    .eq('event_id', event.id)
    .in('id', ids)
    .not('email', 'is', null);

  if (guestsError) {
    return NextResponse.json({ error: guestsError.message }, { status: 500 });
  }

  const noteById = new Map(notes.map((n: { rsvp_id: string; note: string }) => [n.rsvp_id, n.note]));

  const results = await Promise.allSettled(
    (guests || []).map((g) => {
      const personal = noteById.get(g.id) || '';
      const text = [base_message, personal].filter(Boolean).join('\n\n');
      return resend.emails.send({
        from: process.env.EMAIL_FROM || 'invites@resend.dev',
        to: g.email as string,
        subject,
        text: `Hi ${g.name},\n\n${text}\n\n— ${event.title}`,
        html: renderEmailHtml({
          heading: subject,
          bodyLines: [`Hi ${g.name},`, ...text.split('\n\n')],
          footer: `Sent from the ${event.title} dashboard.`,
        }),
      });
    })
  );

  const failed = results.filter((r) => r.status === 'rejected').length;
  return NextResponse.json({ sent: (guests?.length || 0) - failed, failed });
}
