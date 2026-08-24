import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';
import { absoluteUrl, renderEmailHtml } from '@/lib/email';
import { destinationFor, geocode } from '@/lib/maps';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    title,
    description,
    location,
    map_query,
    host_email,
    event_date,
    theme,
    template,
    purpose,
    custom_eyebrow,
    custom_headline,
    partner1,
    partner2,
    honoree,
    closing_line,
    photo_url,
    paper_texture,
  } = body;

  if (!title || !event_date) {
    return NextResponse.json({ error: 'Title and date are required' }, { status: 400 });
  }

  // Resolve the venue to coordinates once, here, so the invite page can
  // embed a map without geocoding on every view. Best-effort: if this
  // fails the page just falls back to the directions link.
  const destination = destinationFor(location || '', map_query);
  const point = destination ? await geocode(destination) : null;

  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from('events')
    .insert({
      title,
      description: description || null,
      location: location || null,
      map_query: map_query || null,
      map_lat: point?.lat ?? null,
      map_lng: point?.lng ?? null,
      host_email: host_email || null,
      event_date,
      theme: theme || 'lime',
      template: template || 'letterpress',
      purpose: purpose || 'invite',
      custom_eyebrow: custom_eyebrow || null,
      custom_headline: custom_headline || null,
      partner1: partner1 || null,
      partner2: partner2 || null,
      honoree: honoree || null,
      closing_line: closing_line || null,
      photo_url: photo_url || null,
      paper_texture: Boolean(paper_texture),
    })
    .select('id, view_token, edit_token')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Email the host their dashboard link so they don't lose access to their
  // own event. Best-effort — a failure here shouldn't block event creation.
  if (host_email) {
    const dashboardUrl = absoluteUrl(`/dashboard/${data.edit_token}`);
    const guestUrl = absoluteUrl(`/e/${data.view_token}`);
    try {
      await resend.emails.send({
        from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
        to: host_email,
        subject: `Your dashboard link for "${title}"`,
        text: `Your event is live.\n\nDashboard (keep this link private): ${dashboardUrl}\n\nShare this with guests: ${guestUrl}`,
        html: renderEmailHtml({
          heading: `${title} is live`,
          bodyLines: [
            'Your event was created. Use the dashboard link below to manage RSVPs and send updates — keep it private, anyone with it can edit your event.',
          ],
          primary: { label: 'Open dashboard', url: dashboardUrl },
          secondary: { label: 'Share this link with guests:', url: guestUrl },
          footer: 'Sent by LiteInvite because you created an event with this address as the host contact.',
        }),
      });
    } catch {
      // Swallow — event was created successfully either way.
    }
  }

  return NextResponse.json(data);
}
