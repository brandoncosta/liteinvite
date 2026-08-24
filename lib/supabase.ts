import { createClient } from '@supabase/supabase-js';

// Server-side client only — uses the service role key so RLS's wide-open
// policies never get hit directly from the browser. All access goes
// through our API routes, which check the view/edit token themselves.
//
// The `global.fetch` override is the important part: Next.js patches the
// global `fetch` function to cache responses (its "Data Cache") unless a
// call explicitly opts out, and that patch applies everywhere — page
// Server Components AND API route handlers alike — not just the ones
// marked `export const dynamic = 'force-dynamic'`. Supabase's client
// calls this same global `fetch` under the hood for every query, so
// without this override, a page or route that forgets that per-file
// opt-out (easy to lose track of, especially across manual file uploads)
// can silently keep serving a stale snapshot from whenever it first ran —
// exactly what caused guests/RSVPs to "not show up" after being added.
// Passing `cache: 'no-store'` here forces every single Supabase call,
// everywhere in the app, to always hit the database fresh — this one
// change matters more than any number of per-page dynamic exports.
export function supabaseServer() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false },
      global: {
        fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }),
      },
    }
  );
}

// Fourteen palettes pulled from the moodboard photos — the lime and sage
// letterpress papers, the coral and terracotta suite, the lavender and
// grape wedding cards, the mustard RSVP card, the bright orange
// hand-lettered invite, the bold tomato-red suite, the blush and hot-pink
// cards — plus a few we felt were missing to round the set out: a deep
// forest, a warm butter, a near-black ink and a plain cream neutral.
// Every palette carries its own *text* colors, not just a background.
// Existing rows with a retired theme value fall back to `lime`.
export type Theme =
  | 'lime' | 'sage' | 'forest' | 'olive'
  | 'coral' | 'terracotta' | 'orange' | 'tomato'
  | 'blush' | 'hotpink' | 'lavender' | 'grape'
  | 'mustard' | 'butter' | 'ink' | 'cream';
// The card's overall visual style. Ten templates rebuilt from scratch, each
// modelled on a specific moodboard card and laying out a full typographic
// detail stack (eyebrow → hero → date/time → venue → closing note) rather
// than a headline with one caption line under it. Old rows carrying a
// retired template name fall back to `editorial` in the card component.
export type Template =
  | 'letterpress'   // arched eyebrow over huge debossed display caps, tone-on-tone
  | 'stacked-names' // "THE WEDDING OF / PAUL keith + JARED beck" + flanked date block
  | 'script-announce' // tracked eyebrow, big cursive line, small-caps detail stack
  | 'bubble-doodle' // chunky rounded caps + hand-drawn flower doodles on cream
  | 'marker-bold'   // saturated ground, thick uneven marker caps at mixed sizes
  | 'poster'        // huge condensed sans on a saturated block
  | 'editorial'     // quiet serif, hairline rules, cream
  | 'arch'          // display headline curved along an arc
  | 'ticket'        // bordered badge with a perforated-edge detail
  | 'photo';        // photo up top, detail stack below
// What the card is for. Drives the fixed copy each template shows and,
// importantly, *which extra fields the form asks for* — a wedding or
// save-the-date collects two names, a birthday collects the guest of
// honor, and `custom` lets the host write both lines themselves.
export type Purpose =
  | 'invite'
  | 'wedding'
  | 'save-the-date'
  | 'engagement'
  | 'birthday'
  | 'shower'
  | 'thank-you'
  | 'custom';
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
  // The host's own eyebrow + headline text, used only when purpose === 'custom'.
  custom_eyebrow: string | null;
  custom_headline: string | null;
  // Collected when the purpose is a two-name occasion (wedding, save-the-date,
  // engagement) — drives the "PAUL + JARED" hero treatment on every template.
  partner1: string | null;
  partner2: string | null;
  // Collected when the purpose centers on one person (birthday, shower).
  honoree: string | null;
  // The closing line printed at the foot of the card ("Dancing & merriment
  // to follow", "Cocktail attire"), straight out of the moodboard cards.
  closing_line: string | null;
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
