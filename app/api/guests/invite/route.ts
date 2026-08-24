import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';
import { absoluteUrl, renderEmailHtml } from '@/lib/email';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Resend accepts up to 100 emails per batch request, and allows 10
// requests per second. One batch per 100 guests, with a pause between
// batches, keeps even a very long list comfortably inside both limits.
const BATCH_SIZE = 100;
const BATCH_PAUSE_MS = 400;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// A big list can take a few seconds of wall-clock time to push through;
// the default serverless timeout is short enough to cut that off midway.
export const maxDuration = 60;

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

    // Build one payload per guest, then hand them to Resend's *batch*
    // endpoint. Sending them individually (one API call each) is what
    // caused "Sent 0, 30 failed — you can only make 10 requests per
    // second": 30 parallel sends blew straight through Resend's rate
    // limit. batch.send delivers up to 100 emails in a single request, so
    // a 30-guest list is now one call instead of thirty.
    const payloads = guests.map((g) => {
      const inviteUrl = absoluteUrl(`/e/${event.view_token}?g=${g.invite_token}`);
      return {
        from: process.env.EMAIL_FROM || 'invites@resend.dev',
        to: g.email,
        subject: `You're invited: ${event.title}`,
        text: `Hi ${g.name},\n\nYou're invited to ${event.title} on ${dateLabel}${event.location ? ` at ${event.location}` : ''}.\n\nRSVP here: ${inviteUrl}`,
        html: renderEmailHtml({
          heading: `You're invited: ${event.title}`,
          bodyLines: [`Hi ${g.name},`, `${dateLabel}${event.location ? ` · ${event.location}` : ''}`],
          primary: { label: 'RSVP', url: inviteUrl },
        }),
      };
    });

    const sentIds: string[] = [];
    const failures: string[] = [];

    // 100 is Resend's per-batch ceiling. Lists longer than that get split,
    // with a short pause between batches so even many batches stay under
    // the 10-requests-per-second limit.
    for (let start = 0; start < payloads.length; start += BATCH_SIZE) {
      const slice = payloads.slice(start, start + BATCH_SIZE);
      const sliceGuests = guests.slice(start, start + BATCH_SIZE);
      if (start > 0) await sleep(BATCH_PAUSE_MS);

      try {
        // Like emails.send, batch.send resolves with { data, error } for
        // API-level failures rather than throwing.
        const { error: batchError } = await resend.batch.send(slice);
        if (batchError) {
          failures.push(batchError.message || 'Resend rejected the batch');
          continue;
        }
        sentIds.push(...sliceGuests.map((g) => g.id));
      } catch (err) {
        failures.push(err instanceof Error ? err.message : 'Batch send failed');
      }
    }

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

    return NextResponse.json({
      sent: sentIds.length,
      failed: guests.length - sentIds.length,
      // Surface *why* sends failed instead of a bare count — this is what
      // was missing before, so "it doesn't work" had no diagnosis.
      error: failures.length > 0 ? failures[0] : undefined,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unexpected server error sending invites' },
      { status: 500 }
    );
  }
}
