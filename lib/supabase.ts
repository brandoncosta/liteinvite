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

export type Theme = 'teal' | 'coral' | 'purple' | 'pink' | 'amber';
// The card's overall visual style — pulled straight from the moodboard.
// `layout` (centered/left/accent/photo) is retired in favor of this — it
// stays in the DB for old rows but the app no longer reads or writes it.
export type Template =
  | 'editorial'  // quiet serif type, one thin rule
  | 'poster'     // bold saturated color block, big headline
  | 'linework'   // italic serif, hand-drawn squiggle divider
  | 'stacked'    // big mirrored type — good for thank-yous
  | 'photo'      // photo up top, caption below
  | 'arch'       // headline curved along an arc
  | 'ticket'     // bordered ticket/badge with a pill detail
  | 'script'     // cursive headline on a saturated color
  | 'bubble'     // chunky rounded caps on a saturated color
  | 'scatter'    // jumbled, playfully rotated letters
  | 'letterpress'; // debossed, tone-on-tone type on pastel paper
export type Layout = 'centered' | 'left' | 'accent' | 'photo';
export type RsvpStatus = 'yes' | 'no' | 'maybe';

export interface EventRecord {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  host_email: string | null;
  event_date: string;
  theme: Theme;
  template: Template;
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
