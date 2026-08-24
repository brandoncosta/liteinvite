import { Purpose, Template, Theme } from '@/lib/supabase';

// Eight palettes pulled from the moodboard photos, each carrying its own
// text colors — not just a background swap. `accent` sits on the cream
// templates (a rule, an eyebrow, a doodle); `bg`/`bgInk` is the full-bleed
// saturated pair (bgInk flips to a light cream on the two dark/saturated
// themes — red, ink — instead of forcing dark text on a dark ground);
// `paper`/`paperInk` is the soft pastel-paper pair for the tone-on-tone
// letterpress and names-grid templates.
const COLORS: Record<Theme, { accent: string; bg: string; bgInk: string; paper: string; paperInk: string }> = {
  sage: { accent: '#5E8A6E', bg: '#8FAE55', bgInk: '#1F2E12', paper: '#E6EEDA', paperInk: '#5C7A3E' },
  coral: { accent: '#C97354', bg: '#EE8F68', bgInk: '#3F1B0C', paper: '#F7DDCC', paperInk: '#C0704A' },
  lavender: { accent: '#7D71C4', bg: '#A79BE8', bgInk: '#221A4A', paper: '#E4DFF7', paperInk: '#6E62B8' },
  blush: { accent: '#C67590', bg: '#EC8FAE', bgInk: '#3F1120', paper: '#F7DCE6', paperInk: '#C4688E' },
  mustard: { accent: '#AD7E28', bg: '#E8B23A', bgInk: '#332000', paper: '#F7E7C4', paperInk: '#AD7E28' },
  red: { accent: '#C13B27', bg: '#E6432E', bgInk: '#FBF3E8', paper: '#F7DCD3', paperInk: '#C13B27' },
  olive: { accent: '#63702F', bg: '#A6B84A', bgInk: '#1E2408', paper: '#ECEED2', paperInk: '#63702F' },
  ink: { accent: '#332F26', bg: '#211D14', bgInk: '#F4EDDD', paper: '#E6E1D3', paperInk: '#332F26' },
};
// Old saved rows may still carry a retired theme key (teal/purple/pink/
// amber from the previous version) — fall back rather than crash.
function colorsFor(theme: Theme) {
  return COLORS[theme] || COLORS.sage;
}

const CREAM = '#FAF6EE';
const INK = '#2B2822';
const MUTED = '#7A7568';
const SERIF = 'var(--font-serif, Georgia, serif)';
const DISPLAY = 'var(--font-display, Impact, sans-serif)'; // condensed bold caps
const ROUND = 'var(--font-round, Arial Rounded MT Bold, sans-serif)'; // chunky bubble caps
const SCRIPT = 'var(--font-script, cursive)';
const MARKER = 'var(--font-marker, cursive)'; // thick uneven marker-pen caps
const SANS = "-apple-system, 'Helvetica Neue', Helvetica, Arial, sans-serif";

// Roughly an actual invite's proportions (closer to 4:5.5) instead of a
// wide banner, and a soft shadow so it reads like a printed card sitting
// on a table rather than a flat website block.
const shell: React.CSSProperties = {
  borderRadius: 6,
  minHeight: 460,
  position: 'relative',
  overflow: 'hidden',
  boxShadow: '0 1px 2px rgba(30,26,18,0.06), 0 14px 32px -12px rgba(30,26,18,0.18)',
};

// Big headline type has no room to overflow — the card clips it (shell's
// overflow: hidden), so a single long word at 40-60px would otherwise get
// silently cut off at the edge instead of wrapping. Spread onto every
// large headline style object as a safety net.
const WRAP: React.CSSProperties = { overflowWrap: 'break-word', wordBreak: 'break-word' };

interface Props {
  theme: Theme;
  template: Template;
  // What the card is for. Drives the fixed headline every template shows
  // ("You're Invited" / "Save the Date" / "Thank You!") — or, for
  // "custom", whatever the host typed into customHeadline — so the host
  // isn't designing anything: they pick a purpose and a style, and their
  // own title/subtitle become the supporting detail line around it.
  purpose: Purpose;
  title: string;
  subtitle?: string;
  customHeadline?: string | null;
  // Optional name-forward fields. When both are filled in, the
  // name-driven templates (names-grid, bubble-doodle, bold-marker) show
  // "PARTNER1 & PARTNER2" as the hero text instead of the generic title —
  // the "PAUL + JARED" / "STEVIE JONES & HAYDEN SMITH" look.
  partner1?: string | null;
  partner2?: string | null;
  photoUrl?: string | null;
  paperTexture?: boolean;
}

// Turns (purpose, title, subtitle, customHeadline) into what actually gets
// drawn: eyebrow (small line above the headline), headline (the dominant
// type), and caption (the detail line below). For "invite" the event's
// own title stays the star and a fixed eyebrow sits above it — for
// "save-the-date" and "thank-you" the fixed phrase takes over as the
// headline instead, and the event's own info becomes the caption
// underneath. "custom" uses whatever the host typed as the headline, same
// treatment as save-the-date/thank-you.
function getCopy(purpose: Purpose, title: string, subtitle?: string, customHeadline?: string | null) {
  const detail = [title, subtitle].filter(Boolean).join(' · ') || undefined;
  switch (purpose) {
    case 'save-the-date':
      return { eyebrow: undefined, headline: 'Save the Date', caption: detail };
    case 'thank-you':
      return { eyebrow: undefined, headline: 'Thank You!', caption: detail };
    case 'custom': {
      const custom = customHeadline?.trim();
      return custom ? { eyebrow: undefined, headline: custom, caption: detail } : { eyebrow: "You're Invited", headline: title, caption: subtitle };
    }
    case 'invite':
    default:
      return { eyebrow: "You're Invited", headline: title, caption: subtitle };
  }
}

// A short kicker line some templates always want above the headline, even
// on purposes that don't produce an `eyebrow` from getCopy (save-the-date/
// thank-you/custom already spend their headline on the fixed phrase).
const KICKER: Record<Purpose, string> = {
  invite: "You're Invited",
  'save-the-date': 'Mark your calendars',
  'thank-you': 'With so much love',
  custom: 'A little celebration',
};

// The card "design system": ten templates built from the ground up to sit
// close to the moodboard rather than reading as generic web cards — most
// are name-forward or hand-drawn rather than a quiet centered paragraph.
// No per-card design work, no illustration library — every template is
// built from type, rules, and simple shapes/SVG. An optional fixed
// paper-grain texture can be toggled on over any of them.
export default function InviteCard({ theme, template, purpose, title, subtitle, customHeadline, partner1, partner2, photoUrl, paperTexture }: Props) {
  const { eyebrow, headline, caption } = getCopy(purpose, title, subtitle, customHeadline);
  const names = partner1?.trim() && partner2?.trim() ? { a: partner1.trim(), b: partner2.trim() } : null;
  const sub: Sub = { theme, eyebrow, title: headline, subtitle: caption, paperTexture, purpose, names };
  switch (template) {
    case 'poster':
      return <Poster {...sub} />;
    case 'letterpress-arch':
      return <LetterpressArch {...sub} />;
    case 'names-grid':
      return <NamesGrid {...sub} />;
    case 'bubble-doodle':
      return <BubbleDoodle {...sub} />;
    case 'cursive-announce':
      return <CursiveAnnounce {...sub} />;
    case 'bold-marker':
      return <BoldMarker {...sub} />;
    case 'ticket':
      return <Ticket {...sub} />;
    case 'scatter':
      return <Scatter {...sub} />;
    case 'photo':
      return <PhotoLed {...sub} photoUrl={photoUrl} />;
    case 'editorial':
    default:
      return <Editorial {...sub} />;
  }
}

type Sub = {
  theme: Theme;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  paperTexture?: boolean;
  purpose: Purpose;
  names: { a: string; b: string } | null;
};

// The one paper-grain texture the app ships with, used everywhere the
// toggle is on — not a per-event pasted URL anymore. Swap this constant
// (or add more and let a template pick one) if you want a different grain.
const PAPER_TEXTURE_URL = 'https://i.postimg.cc/Jzb7RKck/Texturelabs-Paper-178M.jpg';

// Paper-grain texture, blended over whatever's beneath it when the host
// has the toggle on. Sits last in each template's markup so it layers on
// top. `overlay` is CSS's equivalent of Photoshop's Overlay blend mode —
// it multiplies the texture's darks and screens its lights against
// what's underneath, rather than uniformly darkening like `multiply`
// does, which is what keeps a saturated card from just going muddy.
function TextureOverlay({ enabled }: { enabled?: boolean }) {
  if (!enabled) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={PAPER_TEXTURE_URL}
      alt=""
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        mixBlendMode: 'overlay',
        pointerEvents: 'none',
      }}
    />
  );
}

// Deterministic short id from a text seed, so multiple cards on the same
// page (a picker with several previews, say) never collide on an SVG
// <path> id an arced line points at. No hooks, no randomness — same input
// always yields the same id, on the server or the client.
function stableId(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return `arc-${Math.abs(h)}`;
}

// Curves text along a gentle upward arc via an SVG <textPath> — the one
// reliable cross-browser way to bend text along a curve without a canvas
// or an image asset. `fontSize`/`height` are tunable so the same helper
// works for a big arced headline or a small arced eyebrow line.
function ArcText({ text, color, id, fontSize = 44, height = 128 }: { text: string; color: string; id: string; fontSize?: number; height?: number }) {
  const dip = Math.round(height * 1.1);
  return (
    <svg viewBox={`0 0 340 ${height}`} width="100%" height={height} style={{ display: 'block', overflow: 'visible' }}>
      <path id={id} d={`M 15 ${dip} Q 170 ${-Math.round(height * 0.35)} 325 ${dip}`} fill="none" />
      <text fontFamily={DISPLAY} fontSize={fontSize} fill={color} letterSpacing="1">
        <textPath href={`#${id}`} startOffset="50%" textAnchor="middle">
          {text.toUpperCase()}
        </textPath>
      </text>
    </svg>
  );
}

// A small hand-drawn flower doodle — the kind of loose line-art accent
// scattered around the bold hand-lettered invites in the moodboard. Pure
// SVG line art, no image asset, so it can be recolored per theme.
function FlowerDoodle({ color, size = 28, rotate = 0 }: { color: string; size?: number; rotate?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" style={{ display: 'block', transform: `rotate(${rotate}deg)` }}>
      <g stroke={color} strokeWidth="2" strokeLinecap="round" fill="none">
        <circle cx="20" cy="11" r="7" />
        <circle cx="29" cy="20" r="7" />
        <circle cx="20" cy="29" r="7" />
        <circle cx="11" cy="20" r="7" />
        <circle cx="20" cy="20" r="3" fill={color} stroke="none" />
      </g>
    </svg>
  );
}

// Quiet, type-led: cream ground, big serif headline set tight, one thin
// accent rule. The restrained option — everything else in this file goes
// bigger and bolder.
function Editorial({ theme, eyebrow, title, subtitle, paperTexture }: Sub) {
  const { accent } = colorsFor(theme);
  return (
    <div style={{ ...shell, background: CREAM, color: INK, border: '1px solid rgba(43,40,34,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <div style={{ padding: '3rem 2rem' }}>
        {eyebrow && <div style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: accent, marginBottom: 18 }}>{eyebrow}</div>}
        <div style={{ fontFamily: SERIF, fontSize: 42, fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1.04, ...WRAP }}>{title}</div>
        <div style={{ width: 44, height: 2, background: accent, margin: '22px auto' }} />
        {subtitle && <div style={{ fontFamily: SANS, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', color: MUTED }}>{subtitle}</div>}
      </div>
      <TextureOverlay enabled={paperTexture} />
    </div>
  );
}

// Bold and saturated: the theme color takes over the whole card, a huge
// condensed uppercase headline that fills the space, a rotated corner tag
// like a price sticker (its text follows the purpose).
function Poster({ theme, eyebrow, title, subtitle, paperTexture, purpose, names }: Sub) {
  const { bg, bgInk } = colorsFor(theme);
  const tag = purpose === 'save-the-date' ? 'Hold the date' : purpose === 'thank-you' ? 'Thanks' : purpose === 'custom' ? 'Celebrate' : 'Invite';
  const headline = names ? `${names.a} & ${names.b}` : title;
  return (
    <div style={{ ...shell, background: bg, color: bgInk, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div
        style={{
          position: 'absolute',
          top: 22,
          right: -38,
          background: bgInk,
          color: bg,
          fontFamily: SANS,
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          padding: '5px 42px',
          transform: 'rotate(35deg)',
        }}
      >
        {tag}
      </div>
      <div style={{ padding: '2.5rem 2rem 2.25rem' }}>
        {eyebrow && (
          <div style={{ fontFamily: SANS, fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
            {eyebrow}
          </div>
        )}
        <div style={{ fontFamily: SANS, fontSize: 60, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 0.86, textTransform: 'uppercase', ...WRAP }}>
          {headline}
        </div>
        {subtitle && (
          <div style={{ marginTop: 22, paddingTop: 14, borderTop: `1px solid ${bgInk}55`, fontFamily: SANS, fontSize: 13, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {subtitle}
          </div>
        )}
      </div>
      <TextureOverlay enabled={paperTexture} />
    </div>
  );
}

// Tone-on-tone deboss on pastel paper — small eyebrow arced above a huge
// straight headline, the "PLEASE JOIN US TO CELEBRATE OUR WEDDING / CORRIE"
// letterpress-invitation look. Text and background share a hue, with a
// soft dual shadow standing in for an actual letterpress impression.
function LetterpressArch({ theme, eyebrow, title, subtitle, paperTexture, names }: Sub) {
  const { paper, paperInk } = colorsFor(theme);
  const emboss = '1px 1px 1px rgba(255,255,255,0.7), -1px -1px 1px rgba(0,0,0,0.15)';
  const headline = names ? names.a : title;
  return (
    <div style={{ ...shell, background: paper, color: paperInk, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <div style={{ padding: '1.5rem 1.75rem 2.5rem' }}>
        {eyebrow && (
          <div style={{ marginBottom: -14 }}>
            <ArcText text={eyebrow} color={paperInk} id={stableId(`lp-${eyebrow}`)} fontSize={16} height={64} />
          </div>
        )}
        <div style={{ fontFamily: DISPLAY, fontSize: 54, letterSpacing: '0.01em', lineHeight: 1.0, textTransform: 'uppercase', textShadow: emboss, ...WRAP }}>
          {headline}
        </div>
        {names && (
          <div style={{ marginTop: 10, fontFamily: SANS, fontSize: 15, fontWeight: 600, letterSpacing: '0.04em', textShadow: emboss }}>& {names.b}</div>
        )}
        <div style={{ width: 36, height: 2, background: paperInk, margin: '20px auto', opacity: 0.5 }} />
        {subtitle && <div style={{ fontFamily: SANS, fontSize: 13, letterSpacing: '0.06em', textTransform: 'uppercase', opacity: 0.8 }}>{subtitle}</div>}
      </div>
      <TextureOverlay enabled={paperTexture} />
    </div>
  );
}

// Name-forward, "THE WEDDING OF / PAUL + JARED" — big serif names on soft
// pastel paper with a bordered detail block underneath, echoing the
// lavender wedding invite in the moodboard. Falls back to the plain
// headline when no partner names are set.
function NamesGrid({ theme, eyebrow, title, subtitle, paperTexture, purpose, names }: Sub) {
  const { paper, paperInk } = colorsFor(theme);
  const kicker = names && purpose === 'invite' ? 'The Wedding Of' : eyebrow || (names ? KICKER[purpose] : undefined);
  return (
    <div style={{ ...shell, background: paper, color: paperInk, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <div style={{ padding: '2.5rem 2rem' }}>
        {kicker && <div style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 16 }}>{kicker}</div>}
        {names ? (
          <div style={{ fontFamily: SERIF, lineHeight: 1.08 }}>
            <div style={{ fontSize: 44, fontWeight: 600, letterSpacing: '-0.01em', ...WRAP }}>{names.a}</div>
            <div style={{ fontSize: 20, margin: '6px 0', opacity: 0.7 }}>+</div>
            <div style={{ fontSize: 44, fontWeight: 600, letterSpacing: '-0.01em', ...WRAP }}>{names.b}</div>
          </div>
        ) : (
          <div style={{ fontFamily: SERIF, fontSize: 40, fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.06, ...WRAP }}>{title}</div>
        )}
        {subtitle && (
          <div
            style={{
              marginTop: 26,
              paddingTop: 16,
              borderTop: `1px solid ${paperInk}44`,
              fontFamily: SANS,
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
      <TextureOverlay enabled={paperTexture} />
    </div>
  );
}

// Chunky rounded "bubble" caps on cream, flanked by hand-drawn flower
// doodles — the "STEVIE JONES ✿ AND ✿ HAYDEN SMITH" look. Falls back to
// the plain headline when no partner names are set.
function BubbleDoodle({ theme, eyebrow, title, subtitle, paperTexture, purpose, names }: Sub) {
  const { accent } = colorsFor(theme);
  const kicker = eyebrow || (names ? KICKER[purpose] : undefined);
  return (
    <div style={{ ...shell, background: CREAM, color: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <div style={{ padding: '2.5rem 2rem', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 2, left: -4 }}>
          <FlowerDoodle color={accent} size={26} rotate={-10} />
        </div>
        <div style={{ position: 'absolute', top: 30, right: -6 }}>
          <FlowerDoodle color={accent} size={20} rotate={14} />
        </div>
        <div style={{ position: 'absolute', bottom: 6, left: 8 }}>
          <FlowerDoodle color={accent} size={20} rotate={22} />
        </div>
        {kicker && <div style={{ fontFamily: SANS, fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: INK, marginBottom: 12 }}>{kicker}</div>}
        {names ? (
          <div style={{ fontFamily: ROUND, fontSize: 44, lineHeight: 0.98, textTransform: 'uppercase', ...WRAP }}>
            {names.a}
            <div style={{ fontFamily: SCRIPT, fontSize: 22, color: INK, margin: '2px 0', textTransform: 'none' }}>and</div>
            {names.b}
          </div>
        ) : (
          <div style={{ fontFamily: ROUND, fontSize: 48, lineHeight: 0.94, textTransform: 'uppercase', ...WRAP }}>{title}</div>
        )}
        {subtitle && <div style={{ marginTop: 20, fontFamily: SANS, fontSize: 13, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: INK }}>{subtitle}</div>}
      </div>
      <TextureOverlay enabled={paperTexture} />
    </div>
  );
}

// Small tracked kicker, huge cursive script headline in the accent color
// on cream — the "IT'S FINALLY HAPPENING / Natalie and Adriano are
// engaged!" look.
function CursiveAnnounce({ theme, eyebrow, title, subtitle, paperTexture, purpose }: Sub) {
  const { accent } = colorsFor(theme);
  const kicker = eyebrow || KICKER[purpose];
  return (
    <div style={{ ...shell, background: CREAM, color: INK, border: '1px solid rgba(43,40,34,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <div style={{ padding: '2.75rem 2rem' }}>
        <div style={{ fontFamily: SANS, fontSize: 12, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: MUTED, marginBottom: 18 }}>{kicker}</div>
        <div style={{ fontFamily: SCRIPT, fontSize: 58, lineHeight: 1.08, color: accent, ...WRAP }}>{title}</div>
        {subtitle && <div style={{ marginTop: 22, fontFamily: SANS, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', color: MUTED }}>{subtitle}</div>}
      </div>
      <TextureOverlay enabled={paperTexture} />
    </div>
  );
}

// Saturated color, thick uneven marker-pen lettering, loosely composed
// and left-aligned — the "We're excited to celebrate with you / You're
// invited to the wedding of Ethan & Luna" look.
function BoldMarker({ theme, eyebrow, title, subtitle, paperTexture, purpose, names }: Sub) {
  const { bg, bgInk } = colorsFor(theme);
  const kicker = eyebrow || KICKER[purpose];
  const headline = names ? `${names.a} & ${names.b}` : title;
  return (
    <div style={{ ...shell, background: bg, color: bgInk, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ padding: '2.5rem 2.25rem', textAlign: 'left', width: '100%' }}>
        <div style={{ fontFamily: MARKER, fontSize: 19, lineHeight: 1.3, transform: 'rotate(-1deg)', marginBottom: 14 }}>{kicker}</div>
        <div style={{ fontFamily: MARKER, fontSize: 40, lineHeight: 1.12, transform: 'rotate(-1deg)', ...WRAP }}>{headline}</div>
        {subtitle && (
          <div style={{ marginTop: 20, fontFamily: SANS, fontSize: 13, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{subtitle}</div>
        )}
      </div>
      <TextureOverlay enabled={paperTexture} />
    </div>
  );
}

// Bordered like an event ticket: an inset rule, big condensed bold caps
// headline, subtitle in a pill-shaped outline chip.
function Ticket({ theme, eyebrow, title, subtitle, paperTexture }: Sub) {
  const { accent } = colorsFor(theme);
  return (
    <div style={{ ...shell, background: CREAM, color: INK, border: '1px solid rgba(43,40,34,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ margin: '1.25rem', padding: '3rem 1.5rem', border: `1.5px solid ${accent}`, borderRadius: 10, textAlign: 'center', width: '100%' }}>
        {eyebrow && <div style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: accent, marginBottom: 14 }}>{eyebrow}</div>}
        <div style={{ fontFamily: DISPLAY, fontSize: 46, letterSpacing: '0.01em', lineHeight: 1.0, textTransform: 'uppercase', ...WRAP }}>{title}</div>
        {subtitle && (
          <div
            style={{
              display: 'inline-block',
              marginTop: 22,
              padding: '7px 18px',
              border: `1.5px solid ${accent}`,
              borderRadius: 999,
              fontFamily: SANS,
              fontSize: 12,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: accent,
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
      <TextureOverlay enabled={paperTexture} />
    </div>
  );
}

// Jumbled, playfully rotated letters filling a solid color card — the
// scrapbook/collage "SAVE THE DATE" look. Rotation is a deterministic
// function of each letter's position, never Math.random, so server and
// client render identically (no hydration mismatch) and every reload
// looks the same rather than jittering around.
function Scatter({ theme, eyebrow, title, subtitle, paperTexture }: Sub) {
  const { bg, bgInk } = colorsFor(theme);
  const words = title.split(' ');
  let i = 0;
  return (
    <div style={{ ...shell, background: bg, color: bgInk, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <div style={{ padding: '2.25rem 1.75rem' }}>
        {eyebrow && (
          <div style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>
            {eyebrow}
          </div>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '2px 14px' }}>
          {words.map((word, w) => (
            <div key={w} style={{ display: 'flex' }}>
              {word.split('').map((ch, ci) => {
                i++;
                const angle = ((i * 47) % 25) - 12; // -12..12 degrees, deterministic
                const rise = ((i * 17) % 11) - 5; // -5..5 px, deterministic
                return (
                  <span key={ci} style={{ display: 'inline-block', fontFamily: DISPLAY, fontSize: 44, lineHeight: 1, transform: `rotate(${angle}deg) translateY(${rise}px)` }}>
                    {ch}
                  </span>
                );
              })}
            </div>
          ))}
        </div>
        {subtitle && (
          <div style={{ marginTop: 26, fontFamily: SANS, fontSize: 13, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{subtitle}</div>
        )}
      </div>
      <TextureOverlay enabled={paperTexture} />
    </div>
  );
}

// Photo-led: a tall image with a softly waved bottom edge (pure CSS, no
// mask asset), then a cream caption panel underneath — the layered
// postcard look from the save-the-date examples.
function PhotoLed({ theme, eyebrow, title, subtitle, photoUrl, paperTexture }: Sub & { photoUrl?: string | null }) {
  const { accent } = colorsFor(theme);
  return (
    <div style={{ ...shell, background: CREAM, color: INK, border: '1px solid rgba(43,40,34,0.1)' }}>
      <div style={{ borderRadius: '0 0 50% 50% / 0 0 34px 34px', overflow: 'hidden', height: 268, background: `${accent}33` }}>
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: accent }} />
          </div>
        )}
      </div>
      <div style={{ padding: '2rem 1.75rem 2.25rem', textAlign: 'center' }}>
        {eyebrow && <div style={{ fontFamily: SANS, fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: accent, marginBottom: 10 }}>{eyebrow}</div>}
        <div style={{ fontFamily: SERIF, fontSize: 32, fontWeight: 500, letterSpacing: '-0.01em', lineHeight: 1.1 }}>{title}</div>
        <div style={{ width: 34, height: 2, background: accent, margin: '16px auto' }} />
        {subtitle && <div style={{ fontFamily: SANS, fontSize: 13, letterSpacing: '0.06em', textTransform: 'uppercase', color: MUTED }}>{subtitle}</div>}
      </div>
      <TextureOverlay enabled={paperTexture} />
    </div>
  );
}
