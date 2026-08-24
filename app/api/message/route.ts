import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';
import { renderEmailHtml } from '@/lib/email';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// group: 'all' | 'yes' | 'no' | 'maybe'
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { edit_token, subject, message, group } = body;

  if (!edit_token || !subject || !message) {
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

  let query = supabase.from('rsvps').select('name, email').eq('event_id', event.id).not('email', 'is', null);
  if (group && group !== 'all') {
    query = query.eq('status', group);
  }
  const { data: guests, error: guestsError } = await query;

  if (guestsError) {
    return NextResponse.json({ error: guestsError.message }, { status: 500 });
  }
  if (!guests || guests.length === 0) {
    return NextResponse.json({ error: 'No guests with an email in that group' }, { status: 400 });
  }

  const results = await Promise.allSettled(
    guests.map((g) =>
      resend.emails.send({
        from: process.env.EMAIL_FROM || 'invites@resend.dev',
        to: g.email as string,
        subject,
        text: `Hi ${g.name},\n\n${message}\n\n— ${event.title}`,
        html: renderEmailHtml({
          heading: subject,
          bodyLines: [`Hi ${g.name},`, message],
          footer: `Sent from the ${event.title} dashboard.`,
        }),
      })
    )
  );

  const failed = results.filter((r) => r.status === 'rejected').length;
  return NextResponse.json({ sent: guests.length - failed, failed });
}
