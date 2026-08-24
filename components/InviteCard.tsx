import { Template, Theme } from '@/lib/supabase';

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

const shell: React.CSSProperties = {
  borderRadius: 4,
  minHeight: 220,
  position: 'relative',
  overflow: 'hidden',
};

interface Props {
  theme: Theme;
  template: Template;
  title: string;
  subtitle?: string;
  photoUrl?: string | null;
  paperTexture?: boolean;
}

// The card "design system": eleven templates pulled from the moodboard,
// each crossed with five accent colors. No per-card design work, no
// illustration library — every template is built from type, rules, and
// simple shapes/SVG. An optional fixed paper-grain texture can be toggled
// on over any of them (see TextureOverlay below).
export default function InviteCard({ theme, template, title, subtitle, photoUrl, paperTexture }: Props) {
  switch (template) {
    case 'poster':
      return <Poster theme={theme} title={title} subtitle={subtitle} paperTexture={paperTexture} />;
    case 'linework':
      return <Linework theme={theme} title={title} subtitle={subtitle} paperTexture={paperTexture} />;
    case 'stacked':
      return <Stacked theme={theme} title={title} subtitle={subtitle} paperTexture={paperTexture} />;
    case 'photo':
      return <PhotoLed theme={theme} title={title} subtitle={subtitle} photoUrl={photoUrl} paperTexture={paperTexture} />;
    case 'arch':
      return <Arch theme={theme} title={title} subtitle={subtitle} paperTexture={paperTexture} />;
    case 'ticket':
      return <Ticket theme={theme} title={title} subtitle={subtitle} paperTexture={paperTexture} />;
    case 'script':
      return <Script theme={theme} title={title} subtitle={subtitle} paperTexture={paperTexture} />;
    case 'bubble':
      return <Bubble theme={theme} title={title} subtitle={subtitle} paperTexture={paperTexture} />;
    case 'scatter':
      return <Scatter theme={theme} title={title} subtitle={subtitle} paperTexture={paperTexture} />;
    case 'letterpress':
      return <Letterpress theme={theme} title={title} subtitle={subtitle} paperTexture={paperTexture} />;
    case 'editorial':
    default:
      return <Editorial theme={theme} title={title} subtitle={subtitle} paperTexture={paperTexture} />;
  }
}

type Sub = { theme: Theme; title: string; subtitle?: string; paperTexture?: boolean };

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

// Curves text along a gentle upward arc via an SVG <textPath> — the one
// reliable cross-browser way to bend text along a curve without a canvas
// or an image asset.
function ArcText({ text, color, id }: { text: string; color: string; id: string }) {
  return (
    <svg viewBox="0 0 320 110" width="100%" height="92" style={{ display: 'block', overflow: 'visible' }}>
      <path id={id} d="M 15 95 Q 160 -25 305 95" fill="none" />
      <text fontFamily={DISPLAY} fontSize="34" fill={color} letterSpacing="1">
        <textPath href={`#${id}`} startOffset="50%" textAnchor="middle">
          {text.toUpperCase()}
        </textPath>
      </text>
    </svg>
  );
}

// Quiet, type-led: cream ground, serif headline, one thin rule.
function Editorial({ theme, title, subtitle, paperTexture }: Sub) {
  const accent = ACCENT[theme];
  return (
    <div style={{ ...shell, background: CREAM, color: INK, border: '1px solid rgba(43,40,34,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <div style={{ padding: '2.75rem 1.75rem' }}>
        <div style={{ fontFamily: SERIF, fontSize: 26, fontWeight: 500, letterSpacing: '-0.01em', lineHeight: 1.15 }}>{title}</div>
        <div style={{ width: 36, height: 2, background: accent, margin: '14px auto' }} />
        {subtitle && <div style={{ fontSize: 13, letterSpacing: '0.04em', textTransform: 'uppercase', color: MUTED }}>{subtitle}</div>}
      </div>
      <TextureOverlay enabled={paperTexture} />
    </div>
  );
}

// Bold and saturated: the theme color takes over the whole card, a big
// condensed uppercase headline, a rotated corner tag like a price sticker.
function Poster({ theme, title, subtitle, paperTexture }: Sub) {
  const { bg, ink } = POSTER[theme];
  return (
    <div style={{ ...shell, background: bg, color: ink, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div
        style={{
          position: 'absolute',
          top: 16,
          right: -30,
          background: ink,
          color: bg,
          fontFamily: SANS,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          padding: '4px 34px',
          transform: 'rotate(35deg)',
        }}
      >
        Invite
      </div>
      <div style={{ padding: '2.5rem 1.75rem 2rem' }}>
        <div
          style={{
            fontFamily: SANS,
            fontSize: 38,
            fontWeight: 800,
            letterSpacing: '-0.02em',
            lineHeight: 0.95,
            textTransform: 'uppercase',
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div
            style={{
              marginTop: 16,
              paddingTop: 10,
              borderTop: `1px solid ${ink}55`,
              fontFamily: SANS,
              fontSize: 12,
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

// Hand-drawn feel: cream ground, italic serif headline, a thin wavy line
// instead of a straight rule, a tiny line-art flourish.
function Linework({ theme, title, subtitle, paperTexture }: Sub) {
  const accent = ACCENT[theme];
  return (
    <div style={{ ...shell, background: CREAM, color: INK, border: '1px solid rgba(43,40,34,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <div style={{ padding: '2.5rem 1.75rem' }}>
        <svg width="34" height="20" viewBox="0 0 34 20" fill="none" style={{ margin: '0 auto 14px', display: 'block' }}>
          <path
            d="M2 14c3-9 6-9 8.5-2s6 7 8.5-2 6-9 8.5-2 5 9 6.5 4"
            stroke={accent}
            strokeWidth="1.4"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
        <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 27, fontWeight: 500, letterSpacing: '-0.005em', lineHeight: 1.2 }}>{title}</div>
        <svg width="60" height="10" viewBox="0 0 60 10" fill="none" style={{ margin: '14px auto', display: 'block' }}>
          <path d="M1 6c6-8 10 6 15-2s10 6 15-2 10 6 15-2 10 6 13-2" stroke={accent} strokeWidth="1.3" strokeLinecap="round" fill="none" />
        </svg>
        {subtitle && <div style={{ fontSize: 13, letterSpacing: '0.04em', textTransform: 'uppercase', color: MUTED }}>{subtitle}</div>}
      </div>
      <TextureOverlay enabled={paperTexture} />
    </div>
  );
}

// Big stacked typographic type — the title set twice, the second copy
// mirrored and faded like a reflection. Reads well for a punchy invite or
// a "THANK YOU" card, which is exactly what it's for.
function Stacked({ theme, title, subtitle, paperTexture }: Sub) {
  const accent = ACCENT[theme];
  const type: React.CSSProperties = {
    fontFamily: SANS,
    fontSize: 32,
    fontWeight: 800,
    letterSpacing: '-0.02em',
    lineHeight: 0.92,
    textTransform: 'uppercase',
  };
  return (
    <div style={{ ...shell, background: CREAM, color: INK, border: '1px solid rgba(43,40,34,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <div style={{ padding: '2rem 1.5rem' }}>
        <div style={type}>{title}</div>
        <div style={{ width: 28, height: 2, background: accent, margin: '10px auto' }} />
        <div style={{ ...type, opacity: 0.16, transform: 'scaleY(-1)' }}>{title}</div>
        {subtitle && (
          <div style={{ marginTop: 16, fontSize: 13, letterSpacing: '0.04em', textTransform: 'uppercase', color: MUTED }}>{subtitle}</div>
        )}
      </div>
      <TextureOverlay enabled={paperTexture} />
    </div>
  );
}

// Photo-led: an image with a softly waved bottom edge (pure CSS, no mask
// asset), then a cream caption panel underneath — the layered postcard
// look from the save-the-date examples.
function PhotoLed({ theme, title, subtitle, photoUrl, paperTexture }: Sub & { photoUrl?: string | null }) {
  const accent = ACCENT[theme];
  return (
    <div style={{ ...shell, background: CREAM, color: INK, border: '1px solid rgba(43,40,34,0.1)' }}>
      <div style={{ borderRadius: '0 0 50% 50% / 0 0 28px 28px', overflow: 'hidden', height: 168, background: `${accent}33` }}>
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: accent }} />
          </div>
        )}
      </div>
      <div style={{ padding: '1.5rem 1.5rem 1.75rem', textAlign: 'center' }}>
        <div style={{ fontFamily: SERIF, fontSize: 24, fontWeight: 500, letterSpacing: '-0.01em', lineHeight: 1.15 }}>{title}</div>
        <div style={{ width: 30, height: 2, background: accent, margin: '12px auto' }} />
        {subtitle && <div style={{ fontSize: 12, letterSpacing: '0.04em', textTransform: 'uppercase', color: MUTED }}>{subtitle}</div>}
      </div>
      <TextureOverlay enabled={paperTexture} />
    </div>
  );
}

// Headline curved along an arc, cream ground — the "ANDREA AND MARTIN"
// look. General-purpose: works as well for "SAM'S BIRTHDAY" as a wedding.
function Arch({ theme, title, subtitle, paperTexture }: Sub) {
  const accent = ACCENT[theme];
  return (
    <div style={{ ...shell, background: CREAM, color: INK, border: '1px solid rgba(43,40,34,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <div style={{ padding: '1.75rem 1.5rem 2.25rem' }}>
        <ArcText text={title} color={accent} id={stableId(title)} />
        <div style={{ width: 30, height: 2, background: accent, margin: '4px auto 12px' }} />
        {subtitle && <div style={{ fontSize: 12, letterSpacing: '0.04em', textTransform: 'uppercase', color: MUTED }}>{subtitle}</div>}
      </div>
      <TextureOverlay enabled={paperTexture} />
    </div>
  );
}

// Bordered like an event ticket: an inset rule, condensed bold caps
// headline, subtitle in a pill-shaped outline chip.
function Ticket({ theme, title, subtitle, paperTexture }: Sub) {
  const accent = ACCENT[theme];
  return (
    <div style={{ ...shell, background: CREAM, color: INK, border: '1px solid rgba(43,40,34,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ margin: '1rem', padding: '2.25rem 1.25rem', border: `1px solid ${accent}`, borderRadius: 8, textAlign: 'center', width: '100%' }}>
        <div style={{ fontFamily: DISPLAY, fontSize: 30, letterSpacing: '0.01em', lineHeight: 1.05, textTransform: 'uppercase' }}>{title}</div>
        {subtitle && (
          <div
            style={{
              display: 'inline-block',
              marginTop: 16,
              padding: '5px 14px',
              border: `1px solid ${accent}`,
              borderRadius: 999,
              fontSize: 11,
              letterSpacing: '0.05em',
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
function Script({ theme, title, subtitle, paperTexture }: Sub) {
  const { bg } = POSTER[theme];
  return (
    <div style={{ ...shell, background: bg, color: LIGHT_INK, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <div style={{ padding: '2.5rem 1.75rem' }}>
        <div style={{ fontFamily: SCRIPT, fontSize: 40, lineHeight: 1.1 }}>{title}</div>
        {subtitle && (
          <div style={{ marginTop: 14, fontFamily: SANS, fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {subtitle}
          </div>
        )}
      </div>
      <TextureOverlay enabled={paperTexture} />
    </div>
  );
}

// Chunky rounded "bubble" caps on a saturated color — the "FOR EVER" /
// "SARAH+ETHAN" look.
function Bubble({ theme, title, subtitle, paperTexture }: Sub) {
  const { bg, ink } = POSTER[theme];
  return (
    <div style={{ ...shell, background: bg, color: ink, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <div style={{ padding: '2rem 1.5rem' }}>
        <div style={{ fontFamily: ROUND, fontSize: 34, lineHeight: 0.95, textTransform: 'uppercase' }}>{title}</div>
        {subtitle && (
          <div style={{ marginTop: 12, fontFamily: SCRIPT, fontSize: 18, color: ink }}>{subtitle}</div>
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
function Scatter({ theme, title, subtitle, paperTexture }: Sub) {
  const { bg, ink } = POSTER[theme];
  const words = title.split(' ');
  let i = 0;
  return (
    <div style={{ ...shell, background: bg, color: ink, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <div style={{ padding: '2rem 1.5rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0 10px' }}>
          {words.map((word, w) => (
            <div key={w} style={{ display: 'flex' }}>
              {word.split('').map((ch, ci) => {
                i++;
                const angle = ((i * 47) % 21) - 10; // -10..10 degrees, deterministic
                const rise = ((i * 17) % 9) - 4; // -4..4 px, deterministic
                return (
                  <span
                    key={ci}
                    style={{
                      display: 'inline-block',
                      fontFamily: DISPLAY,
                      fontSize: 30,
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
          <div style={{ marginTop: 18, fontFamily: SANS, fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
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
function Letterpress({ theme, title, subtitle, paperTexture }: Sub) {
  const { bg, ink } = LETTERPRESS[theme];
  const emboss = `1px 1px 1px rgba(255,255,255,0.7), -1px -1px 1px rgba(0,0,0,0.18)`;
  return (
    <div style={{ ...shell, background: bg, color: ink, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <div style={{ padding: '2.5rem 1.75rem' }}>
        <div
          style={{
            fontFamily: DISPLAY,
            fontSize: 32,
            letterSpacing: '0.01em',
            lineHeight: 1.05,
            textTransform: 'uppercase',
            textShadow: emboss,
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div style={{ marginTop: 14, fontFamily: SCRIPT, fontSize: 22, textShadow: emboss }}>{subtitle}</div>
        )}
      </div>
      <TextureOverlay enabled={paperTexture} />
    </div>
  );
}
