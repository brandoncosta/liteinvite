import { createClient } from '@supabase/supabase-js';

// Server-side client only — uses the service role key so RLS's wide-open
// policies never get hit directly from the browser. All access goes
// through our API routes, which check the view/edit token themselves.
export function supabaseServer() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

// Eight accent colors pulled straight from the moodboard photos (the sage
// and coral papers, the lavender wedding suite, the mustard RSVP card, the
// bold red suite) plus two we felt were missing from the set: a true
// saturated red and a near-black "ink" neutral for a more sophisticated
// card. Renamed from the old teal/coral/purple/pink/amber set as part of
// the ground-up redesign — existing rows with an old theme value just fall
// back to `sage` in the card component rather than erroring.
export type Theme = 'sage' | 'coral' | 'lavender' | 'blush' | 'mustard' | 'red' | 'olive' | 'ink';
// The card's overall visual style. Ten templates built from scratch to sit
// much closer to the moodboard than the original set — several are
// name-forward (partner1/partner2) rather than title-forward. Old rows
// carrying a retired template name (editorial/poster/linework/stacked/
// photo/arch/ticket/script/bubble/scatter/letterpress from the previous
// version) fall back to `editorial` in the card component.
export type Template =
  | 'editorial'      // quiet serif type, one thin rule
  | 'poster'         // bold saturated color block, huge condensed headline
  | 'letterpress-arch' // tone-on-tone deboss, eyebrow curved above the headline
  | 'names-grid'     // "THE WEDDING OF / PAUL + JARED" — big names, compact detail block
  | 'bubble-doodle'  // chunky rounded caps + hand-drawn flower doodles
  | 'cursive-announce' // small tracked eyebrow, big cursive script headline on cream
  | 'bold-marker'    // saturated color, thick uneven marker-pen lettering
  | 'ticket'         // bordered ticket/badge with a pill detail
  | 'scatter'        // jumbled, playfully rotated letters
  | 'photo';         // photo up top, caption below
// What the card is for — drives the fixed headline every template shows
// ("You're Invited" / "Save the Date" / "Thank You!"), so the host is
// picking a preset rather than composing card copy themselves. `custom`
// lets the host type their own headline for anything that doesn't fit
// those three (a shower, a retirement party, "It's a Girl!", etc).
export type Purpose = 'invite' | 'save-the-date' | 'thank-you' | 'custom';
export type Layout = 'centered' | 'left' | 'accent' | 'photo';
export type RsvpStatus = 'yes' | 'no' | 'maybe';

export interface EventRecord {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  // Optional precise address/coordinates for directions/the embedded map,
  // separate from the free-text `location` guests see displayed on the card.
  map_query: string | null;
  host_email: string | null;
  event_date: string;
  theme: Theme;
  template: Template;
  purpose: Purpose;
  // The host's own headline text, used only when purpose === 'custom'.
  custom_headline: string | null;
  // Optional name-forward fields — fills in name-driven templates like
  // "names-grid" and "bubble-doodle" (the "PAUL + JARED" / "STEVIE JONES
  // & HAYDEN SMITH" look) instead of the generic event title.
  partner1: string | null;
  partner2: string | null;
  photo_url: string | null;
  // Toggle for the built-in paper-grain texture (a fixed image the app
  // ships with, not a per-event URL) blended over the card via CSS
  // mix-blend-mode: overlay.
  paper_texture: boolean;
  view_token: string;
  edit_token: string;
  created_at: string;
}

export interface RsvpRecord {
  id: string;
  event_id: string;
  name: string;
  email: string | null;
  status: RsvpStatus;
  plus_ones: number;
  note: string | null;
  created_at: string;
}

export interface GuestRecord {
  id: string;
  event_id: string;
  name: string;
  email: string;
  invite_token: string;
  invited_at: string | null;
  rsvp_id: string | null;
  created_at: string;
}
