import { Purpose, Template, Theme } from '@/lib/supabase';

// Muted accent used sparingly on the quieter templates — a rule, a dot, a
// squiggle — never a full-bleed color block.
const ACCENT: Record<Theme, string> = {
  teal: '#6E9B8A',
  coral: '#C97A5D',
  purple: '#8B84B0',
  pink: '#C08296',
  amber: '#BD8A3D',
};

// Saturated pair — the theme color takes over the whole card, so it needs
// a matching dark ink for contrast. Used by poster/arch/ticket/scatter.
const POSTER: Record<Theme, { bg: string; ink: string }> = {
  teal: { bg: '#5DCAA5', ink: '#04342C' },
  coral: { bg: '#F0997B', ink: '#4A1B0C' },
  purple: { bg: '#AFA9EC', ink: '#26215C' },
  pink: { bg: '#ED93B1', ink: '#4B1528' },
  amber: { bg: '#EF9F27', ink: '#412402' },
};

// Same saturated backgrounds, but paired with a light ink for templates
// where the type sits directly on the color (script, bubble).
const LIGHT_INK = '#FAF6EE';

// Soft pastel paper + a mid-tone ink of the same hue, for the debossed
// letterpress look — text and background are close in value on purpose.
const LETTERPRESS: Record<Theme, { bg: string; ink: string }> = {
  teal: { bg: '#DCEFE8', ink: '#4C8471' },
  coral: { bg: '#F7DFD3', ink: '#C97A5D' },
  purple: { bg: '#E3E0F5', ink: '#8B84B0' },
  pink: { bg: '#F5DDE6', ink: '#C08296' },
  amber: { bg: '#F5E7CE', ink: '#BD8A3D' },
};

const CREAM = '#FAF6EE';
const INK = '#2B2822';
const MUTED = '#7A7568';
const SERIF = 'var(--font-serif, Georgia, serif)';
const DISPLAY = 'var(--font-display, Impact, sans-serif)'; // condensed bold caps
const ROUND = 'var(--font-round, Arial Rounded MT Bold, sans-serif)'; // chunky bubble caps
const SCRIPT = 'var(--font-script, cursive)';
const SANS = "-apple-system, 'Helvetica Neue', Helvetica, Arial, sans-serif";

// Taller, closer to an actual invite's proportions (roughly 4:5.5) instead
// of a wide banner — and a soft shadow so it reads like a printed card
// sitting on a table rather than a flat website block.
const shell: React.CSSProperties = {
  borderRadius: 6,
  minHeight: 460,
  position: 'relative',
  overflow: 'hidden',
  boxShadow: '0 1px 2px rgba(30,26,18,0.06), 0 14px 32px -12px rgba(30,26,18,0.18)',
};

interface Props {
  theme: Theme;
  template: Template;
  // What the card is for. This drives a fixed headline every template
  // renders the same way — "You're Invited" / "Save the Date" /
  // "Thank You!" — straight out of the moodboard, so the host isn't
  // designing anything: they pick a purpose and a style, and their own
  // title/subtitle become the supporting detail line around it instead
  // of something they have to compose themselves.
  purpose: Purpose;
  title: string;
  subtitle?: string;
  photoUrl?: string | null;
  paperTexture?: boolean;
}

// Turns (purpose, title, subtitle) into what actually gets drawn:
// eyebrow (small line above the headline), headline (the dominant type),
// and caption (the detail line below). For "invite" the event's own
// title stays the star and a fixed eyebrow sits above it — for
// "save-the-date" and "thank-you" the fixed phrase takes over as the
// headline instead, matching how those read in the reference cards, and
// the event's own info becomes the caption underneath.
function getCopy(purpose: Purpose, title: string, subtitle?: string) {
  switch (purpose) {
    case 'save-the-date':
      return { eyebrow: undefined, headline: 'Save the Date', caption: [title, subtitle].filter(Boolean).join(' · ') || undefined };
    case 'thank-you':
      return { eyebrow: undefined, headline: 'Thank You!', caption: [title, subtitle].filter(Boolean).join(' · ') || undefined };
    case 'invite':
    default:
      return { eyebrow: "You're Invited", headline: title, caption: subtitle };
  }
}

// The card "design system": eleven templates pulled from the moodboard,
// each crossed with five accent colors and three purposes. No per-card
// design work, no illustration library — every template is built from
// type, rules, and simple shapes/SVG. An optional fixed paper-grain
// texture can be toggled on over any of them (see TextureOverlay below).
export default function InviteCard({ theme, template, purpose, title, subtitle, photoUrl, paperTexture }: Props) {
  const { eyebrow, headline, caption } = getCopy(purpose, title, subtitle);
  switch (template) {
    case 'poster':
      return <Poster theme={theme} eyebrow={eyebrow} title={headline} subtitle={caption} paperTexture={paperTexture} />;
    case 'linework':
      return <Linework theme={theme} eyebrow={eyebrow} title={headline} subtitle={caption} paperTexture={paperTexture} />;
    case 'stacked':
      return <Stacked theme={theme} eyebrow={eyebrow} title={headline} subtitle={caption} paperTexture={paperTexture} />;
    case 'photo':
      return <PhotoLed theme={theme} eyebrow={eyebrow} title={headline} subtitle={caption} photoUrl={photoUrl} paperTexture={paperTexture} />;
    case 'arch':
      return <Arch theme={theme} eyebrow={eyebrow} title={headline} subtitle={caption} paperTexture={paperTexture} />;
    case 'ticket':
      return <Ticket theme={theme} eyebrow={eyebrow} title={headline} subtitle={caption} paperTexture={paperTexture} />;
    case 'script':
      return <Script theme={theme} eyebrow={eyebrow} title={headline} subtitle={caption} paperTexture={paperTexture} />;
    case 'bubble':
      return <Bubble theme={theme} eyebrow={eyebrow} title={headline} subtitle={caption} paperTexture={paperTexture} />;
    case 'scatter':
      return <Scatter theme={theme} eyebrow={eyebrow} title={headline} subtitle={caption} paperTexture={paperTexture} />;
    case 'letterpress':
      return <Letterpress theme={theme} eyebrow={eyebrow} title={headline} subtitle={caption} paperTexture={paperTexture} />;
    case 'editorial':
    default:
      return <Editorial theme={theme} eyebrow={eyebrow} title={headline} subtitle={caption} paperTexture={paperTexture} />;
  }
}

type Sub = { theme: Theme; eyebrow?: string; title: string; subtitle?: string; paperTexture?: boolean };

// The one paper-grain texture the app ships with, used everywhere the
// toggle is on — not a per-event pasted URL anymore. Swap this constant
// (or add more and let a template pick one) if you want a different grain.
const PAPER_TEXTURE_URL = 'https://i.postimg.cc/Jzb7RKck/Texturelabs-Paper-178M.jpg';

// Paper-grain texture, blended over whatever's beneath it when the host
// has the toggle on. Sits last in each template's markup so it layers on
// top. `overlay` is CSS's equivalent of Photoshop's Overlay blend mode —
// it multiplies the texture's darks and screens its lights against
// what's underneath, rather than uniformly darkening like `multiply`
// does, which is what keeps a saturated poster/bubble/script card from
// just going muddy.
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

// Deterministic short id from the title text, so multiple cards on the
// same page (a picker with several previews, say) never collide on the
// SVG <path> id an arched headline points at. No hooks, no randomness —
// same input always yields the same id, on the server or the client.
function stableId(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return `arc-${Math.abs(h)}`;
}

// A small hand-drawn flower doodle — the kind of loose line-art accent
// scattered around the bold hand-lettered invites in the moodboard. Pure
// SVG line art, no image asset, so it can be recolored per theme.
function FlowerDoodle({ color, size = 30 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" style={{ display: 'block' }}>
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

// Curves text along a gentle upward arc via an SVG <textPath> — the one
// reliable cross-browser way to bend text along a curve without a canvas
// or an image asset.
function ArcText({ text, color, id }: { text: string; color: string; id: string }) {
  return (
    <svg viewBox="0 0 340 140" width="100%" height="128" style={{ display: 'block', overflow: 'visible' }}>
      <path id={id} d="M 15 120 Q 170 -35 325 120" fill="none" />
      <text fontFamily={DISPLAY} fontSize="44" fill={color} letterSpacing="1">
        <textPath href={`#${id}`} startOffset="50%" textAnchor="middle">
          {text.toUpperCase()}
        </textPath>
      </text>
    </svg>
  );
}

// Quiet, type-led: cream ground, big serif headline set tight, one thin
// rule. Restrained on color, but the headline now carries real weight and
// scale instead of reading like a caption.
function Editorial({ theme, eyebrow, title, subtitle, paperTexture }: Sub) {
  const accent = ACCENT[theme];
  return (
    <div style={{ ...shell, background: CREAM, color: INK, border: '1px solid rgba(43,40,34,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <div style={{ padding: '3rem 2rem' }}>
        {eyebrow && <div style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: accent, marginBottom: 18 }}>{eyebrow}</div>}
        <div style={{ fontFamily: SERIF, fontSize: 42, fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1.04 }}>{title}</div>
        <div style={{ width: 44, height: 2, background: accent, margin: '22px auto' }} />
        {subtitle && <div style={{ fontFamily: SANS, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', color: MUTED }}>{subtitle}</div>}
      </div>
      <TextureOverlay enabled={paperTexture} />
    </div>
  );
}

// Bold and saturated: the theme color takes over the whole card, a huge
// condensed uppercase headline that fills the space, a rotated corner tag
// like a price sticker.
function Poster({ theme, eyebrow, title, subtitle, paperTexture }: Sub) {
  const { bg, ink } = POSTER[theme];
  return (
    <div style={{ ...shell, background: bg, color: ink, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div
        style={{
          position: 'absolute',
          top: 22,
          right: -34,
          background: ink,
          color: bg,
          fontFamily: SANS,
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          padding: '5px 40px',
          transform: 'rotate(35deg)',
        }}
      >
        Invite
      </div>
      <div style={{ padding: '2.5rem 2rem 2.25rem' }}>
        {eyebrow && (
          <div style={{ fontFamily: SANS, fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
            {eyebrow}
          </div>
        )}
        <div
          style={{
            fontFamily: SANS,
            fontSize: 62,
            fontWeight: 800,
            letterSpacing: '-0.03em',
            lineHeight: 0.86,
            textTransform: 'uppercase',
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div
            style={{
              marginTop: 22,
              paddingTop: 14,
              borderTop: `1px solid ${ink}55`,
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

// Hand-drawn feel: cream ground, big italic serif headline, thin wavy
// lines instead of straight rules, a tiny line-art flourish above.
function Linework({ theme, eyebrow, title, subtitle, paperTexture }: Sub) {
  const accent = ACCENT[theme];
  return (
    <div style={{ ...shell, background: CREAM, color: INK, border: '1px solid rgba(43,40,34,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <div style={{ padding: '2.75rem 2rem' }}>
        {eyebrow && <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 15, color: accent, marginBottom: 10 }}>{eyebrow}</div>}
        <svg width="42" height="24" viewBox="0 0 34 20" fill="none" style={{ margin: '0 auto 18px', display: 'block' }}>
          <path
            d="M2 14c3-9 6-9 8.5-2s6 7 8.5-2 6-9 8.5-2 5 9 6.5 4"
            stroke={accent}
            strokeWidth="1.4"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
        <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 40, fontWeight: 500, letterSpacing: '-0.01em', lineHeight: 1.08 }}>{title}</div>
        <svg width="72" height="12" viewBox="0 0 60 10" fill="none" style={{ margin: '20px auto', display: 'block' }}>
          <path d="M1 6c6-8 10 6 15-2s10 6 15-2 10 6 15-2 10 6 13-2" stroke={accent} strokeWidth="1.3" strokeLinecap="round" fill="none" />
        </svg>
        {subtitle && <div style={{ fontFamily: SANS, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', color: MUTED }}>{subtitle}</div>}
      </div>
      <TextureOverlay enabled={paperTexture} />
    </div>
  );
}

// Big stacked typographic type — the title set twice, the second copy
// mirrored and faded like a reflection. Reads well for a punchy invite or
// a "THANK YOU" card, which is exactly what it's for.
function Stacked({ theme, eyebrow, title, subtitle, paperTexture }: Sub) {
  const accent = ACCENT[theme];
  const type: React.CSSProperties = {
    fontFamily: SANS,
    fontSize: 48,
    fontWeight: 800,
    letterSpacing: '-0.03em',
    lineHeight: 0.88,
    textTransform: 'uppercase',
  };
  return (
    <div style={{ ...shell, background: CREAM, color: INK, border: '1px solid rgba(43,40,34,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <div style={{ padding: '2.5rem 1.75rem' }}>
        {eyebrow && <div style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: accent, marginBottom: 16 }}>{eyebrow}</div>}
        <div style={type}>{title}</div>
        <div style={{ width: 34, height: 2, background: accent, margin: '16px auto' }} />
        <div style={{ ...type, opacity: 0.14, transform: 'scaleY(-1)' }}>{title}</div>
        {subtitle && (
          <div style={{ marginTop: 22, fontFamily: SANS, fontSize: 13, letterSpacing: '0.06em', textTransform: 'uppercase', color: MUTED }}>{subtitle}</div>
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
  const accent = ACCENT[theme];
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

// Headline curved along an arc, cream ground — the "ANDREA AND MARTIN"
// look. General-purpose: works as well for "SAM'S BIRTHDAY" as a wedding.
function Arch({ theme, eyebrow, title, subtitle, paperTexture }: Sub) {
  const accent = ACCENT[theme];
  return (
    <div style={{ ...shell, background: CREAM, color: INK, border: '1px solid rgba(43,40,34,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <div style={{ padding: '2rem 1.5rem 2.5rem' }}>
        {eyebrow && <div style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: accent, marginBottom: 4 }}>{eyebrow}</div>}
        <ArcText text={title} color={accent} id={stableId(title)} />
        <div style={{ width: 34, height: 2, background: accent, margin: '4px auto 16px' }} />
        {subtitle && <div style={{ fontFamily: SANS, fontSize: 13, letterSpacing: '0.06em', textTransform: 'uppercase', color: MUTED }}>{subtitle}</div>}
      </div>
      <TextureOverlay enabled={paperTexture} />
    </div>
  );
}

// Bordered like an event ticket: an inset rule, big condensed bold caps
// headline, subtitle in a pill-shaped outline chip.
function Ticket({ theme, eyebrow, title, subtitle, paperTexture }: Sub) {
  const accent = ACCENT[theme];
  return (
    <div style={{ ...shell, background: CREAM, color: INK, border: '1px solid rgba(43,40,34,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ margin: '1.25rem', padding: '3rem 1.5rem', border: `1.5px solid ${accent}`, borderRadius: 10, textAlign: 'center', width: '100%' }}>
        {eyebrow && <div style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: accent, marginBottom: 14 }}>{eyebrow}</div>}
        <div style={{ fontFamily: DISPLAY, fontSize: 46, letterSpacing: '0.01em', lineHeight: 1.0, textTransform: 'uppercase' }}>{title}</div>
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

// Cursive headline on a full-bleed saturated color — the "Natalie asked
// and Adriano said yes!" look.
function Script({ theme, eyebrow, title, subtitle, paperTexture }: Sub) {
  const { bg } = POSTER[theme];
  return (
    <div style={{ ...shell, background: bg, color: LIGHT_INK, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <div style={{ padding: '2.75rem 2rem' }}>
        {eyebrow && (
          <div style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>
            {eyebrow}
          </div>
        )}
        <div style={{ fontFamily: SCRIPT, fontSize: 60, lineHeight: 1.05 }}>{title}</div>
        {subtitle && (
          <div style={{ marginTop: 20, fontFamily: SANS, fontSize: 13, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            {subtitle}
          </div>
        )}
      </div>
      <TextureOverlay enabled={paperTexture} />
    </div>
  );
}

// Chunky rounded "bubble" caps on a saturated color, flanked by hand-drawn
// flower doodles — the "STEVIE JONES * HAYDEN SMITH *" look.
function Bubble({ theme, eyebrow, title, subtitle, paperTexture }: Sub) {
  const { bg, ink } = POSTER[theme];
  return (
    <div style={{ ...shell, background: bg, color: ink, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <div style={{ padding: '2.25rem 1.75rem', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 4, left: -2 }}>
          <FlowerDoodle color={ink} size={26} />
        </div>
        <div style={{ position: 'absolute', bottom: 8, right: -4 }}>
          <FlowerDoodle color={ink} size={22} />
        </div>
        {eyebrow && (
          <div style={{ fontFamily: SANS, fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
            {eyebrow}
          </div>
        )}
        <div style={{ fontFamily: ROUND, fontSize: 50, lineHeight: 0.92, textTransform: 'uppercase' }}>{title}</div>
        {subtitle && (
          <div style={{ marginTop: 16, fontFamily: SCRIPT, fontSize: 26, color: ink }}>{subtitle}</div>
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
  const { bg, ink } = POSTER[theme];
  const words = title.split(' ');
  let i = 0;
  return (
    <div style={{ ...shell, background: bg, color: ink, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
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
                  <span
                    key={ci}
                    style={{
                      display: 'inline-block',
                      fontFamily: DISPLAY,
                      fontSize: 44,
                      lineHeight: 1,
                      transform: `rotate(${angle}deg) translateY(${rise}px)`,
                    }}
                  >
                    {ch}
                  </span>
                );
              })}
            </div>
          ))}
        </div>
        {subtitle && (
          <div style={{ marginTop: 26, fontFamily: SANS, fontSize: 13, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {subtitle}
          </div>
        )}
      </div>
      <TextureOverlay enabled={paperTexture} />
    </div>
  );
}

// Debossed, tone-on-tone type on pastel paper — text and background share
// a hue, with a soft dual shadow standing in for an actual letterpress
// impression (no image asset, just text-shadow).
function Letterpress({ theme, eyebrow, title, subtitle, paperTexture }: Sub) {
  const { bg, ink } = LETTERPRESS[theme];
  const emboss = `1px 1px 1px rgba(255,255,255,0.7), -1px -1px 1px rgba(0,0,0,0.18)`;
  return (
    <div style={{ ...shell, background: bg, color: ink, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <div style={{ padding: '2.75rem 2rem' }}>
        {eyebrow && (
          <div style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16, textShadow: emboss }}>{eyebrow}</div>
        )}
        <div
          style={{
            fontFamily: DISPLAY,
            fontSize: 46,
            letterSpacing: '0.01em',
            lineHeight: 1.0,
            textTransform: 'uppercase',
            textShadow: emboss,
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div style={{ marginTop: 20, fontFamily: SCRIPT, fontSize: 28, textShadow: emboss }}>{subtitle}</div>
        )}
      </div>
      <TextureOverlay enabled={paperTexture} />
    </div>
  );
}
