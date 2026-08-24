import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';
import { absoluteUrl, renderEmailHtml } from '@/lib/email';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Sends the actual personalized invite email to each guest on the list —
// this is the step that was missing before: previously the host only ever
// got one shareable link and had to send it themselves. Each guest gets
// their own link (via their invite_token) so their eventual RSVP links
// back to their row on the dashboard automatically.
export async function POST(req: NextRequest) {
  // Wrap the whole handler — an uncaught error here (bad env var, a
  // Supabase hiccup, whatever) used to crash the route and return Next's
  // HTML error page instead of JSON, which made the client's `res.json()`
  // throw and left the "Sending…" button stuck forever with no message.
  // Always return JSON now, even on failure.
  try {
    const body = await req.json();
    const { edit_token, guest_ids } = body as { edit_token?: string; guest_ids?: string[] };

    if (!edit_token || !Array.isArray(guest_ids) || guest_ids.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: 'RESEND_API_KEY is not set on the server — invites can\'t be sent.' }, { status: 500 });
    }

    const supabase = supabaseServer();
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, title, event_date, location, view_token')
      .eq('edit_token', edit_token)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const { data: guests, error: guestsError } = await supabase
      .from('guests')
      .select('id, name, email, invite_token')
      .eq('event_id', event.id)
      .in('id', guest_ids);

    if (guestsError) {
      return NextResponse.json({ error: guestsError.message }, { status: 500 });
    }
    if (!guests || guests.length === 0) {
      return NextResponse.json({ error: 'No matching guests' }, { status: 400 });
    }

    const dateLabel = new Date(event.event_date).toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });

    const results = await Promise.allSettled(
      guests.map(async (g) => {
        const inviteUrl = absoluteUrl(`/e/${event.view_token}?g=${g.invite_token}`);
        // The Resend SDK resolves with { data, error } for most API-level
        // failures (bad/unverified sender, blocked recipient) rather than
        // throwing — only network/auth failures throw. Check both, or a
        // rejected send would silently count as "sent".
        const { error: sendError } = await resend.emails.send({
          from: process.env.EMAIL_FROM || 'invites@resend.dev',
          to: g.email,
          subject: `You're invited: ${event.title}`,
          text: `Hi ${g.name},\n\nYou're invited to ${event.title} on ${dateLabel}${event.location ? ` at ${event.location}` : ''}.\n\nRSVP here: ${inviteUrl}`,
          html: renderEmailHtml({
            heading: `You're invited: ${event.title}`,
            bodyLines: [
              `Hi ${g.name},`,
              `${dateLabel}${event.location ? ` · ${event.location}` : ''}`,
            ],
            primary: { label: 'RSVP', url: inviteUrl },
          }),
        });
        if (sendError) throw new Error(sendError.message || 'Resend rejected the send');
        return g.id;
      })
    );

    const sentIds = results
      .map((r, i) => (r.status === 'fulfilled' ? guests[i].id : null))
      .filter((id): id is string => id !== null);

    if (sentIds.length > 0) {
      const { error: updateError } = await supabase
        .from('guests')
        .update({ invited_at: new Date().toISOString() })
        .in('id', sentIds);
      if (updateError) {
        // Emails went out but the "Invited" flag failed to save — say so
        // explicitly rather than reporting success and leaving the list stale.
        return NextResponse.json(
          { error: `Sent ${sentIds.length} email(s), but failed to update the invite list: ${updateError.message}` },
          { status: 500 }
        );
      }
    }

    const failedResults = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');
    const firstError = failedResults[0]?.reason instanceof Error ? failedResults[0].reason.message : undefined;

    return NextResponse.json({
      sent: sentIds.length,
      failed: failedResults.length,
      // Surface *why* sends failed instead of a bare count — this is what
      // was missing before, so "it doesn't work" had no diagnosis.
      error: failedResults.length > 0 ? firstError || 'One or more sends failed' : undefined,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unexpected server error sending invites' },
      { status: 500 }
    );
  }
}
