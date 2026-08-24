import { Purpose, Template, Theme } from '@/lib/supabase';

/* ------------------------------------------------------------------ *
 * Palettes
 *
 * Sixteen palettes lifted from the moodboard photos. Each one carries a
 * full set of *text* colors, not just a background:
 *   bg / ink            saturated ground + the text that sits on it
 *   paper / paperInk    soft tinted paper + tone-on-tone text (letterpress)
 *   accent              the color type/rules take on a plain cream card
 * ------------------------------------------------------------------ */
type Palette = { bg: string; ink: string; paper: string; paperInk: string; accent: string };

const COLORS: Record<Theme, Palette> = {
  lime: { bg: '#B7CE4E', ink: '#2A3608', paper: '#E8EFC9', paperInk: '#6E8420', accent: '#7C9425' },
  sage: { bg: '#A3B98C', ink: '#22301A', paper: '#E4EBDA', paperInk: '#5E7350', accent: '#61785A' },
  forest: { bg: '#23412C', ink: '#EFEAD8', paper: '#D8E2D6', paperInk: '#2F5138', accent: '#2F5138' },
  olive: { bg: '#8A9440', ink: '#21260A', paper: '#E7E9CE', paperInk: '#5F6A24', accent: '#63702F' },
  coral: { bg: '#F0906A', ink: '#431A0A', paper: '#FADFD1', paperInk: '#C4653E', accent: '#C4653E' },
  terracotta: { bg: '#C4613F', ink: '#FBEDE4', paper: '#F3DACE', paperInk: '#A34A2B', accent: '#A34A2B' },
  orange: { bg: '#F4551E', ink: '#FDEDE4', paper: '#FBDECF', paperInk: '#D8410F', accent: '#E8480F' },
  tomato: { bg: '#E23B2C', ink: '#FDEFE9', paper: '#F9D9D2', paperInk: '#BE2C1F', accent: '#C9321F' },
  blush: { bg: '#F2B4C6', ink: '#4A1B2A', paper: '#FBE4EB', paperInk: '#C4658A', accent: '#C4658A' },
  hotpink: { bg: '#E8538C', ink: '#FDEAF1', paper: '#FADCE8', paperInk: '#C63A70', accent: '#D43F79' },
  lavender: { bg: '#AEA2EE', ink: '#241C55', paper: '#E6E1FA', paperInk: '#6F62BE', accent: '#7566C4' },
  grape: { bg: '#6B54B8', ink: '#EFEAFC', paper: '#DFD8F5', paperInk: '#59449E', accent: '#5E4AA6' },
  mustard: { bg: '#E6B23C', ink: '#372200', paper: '#F8E8C6', paperInk: '#A87B22', accent: '#AD7E28' },
  butter: { bg: '#F3DC91', ink: '#46330A', paper: '#FAF0D2', paperInk: '#A08326', accent: '#A08326' },
  ink: { bg: '#22201A', ink: '#F2ECDC', paper: '#E4E0D4', paperInk: '#33302A', accent: '#33302A' },
  cream: { bg: '#EFE7D6', ink: '#2B2822', paper: '#F7F1E4', paperInk: '#6A6252', accent: '#8A7F68' },
};
// Rows saved before the palette rebuild may carry a retired theme key.
const paletteFor = (theme: Theme): Palette => COLORS[theme] || COLORS.lime;

const CREAM = '#FAF6EE';
const SERIF = 'var(--font-serif, Georgia, serif)';
const DISPLAY = 'var(--font-display, Impact, sans-serif)';
const ROUND = 'var(--font-round, "Arial Rounded MT Bold", sans-serif)';
const SCRIPT = 'var(--font-script, cursive)';
const MARKER = 'var(--font-marker, cursive)';
const SANS = "-apple-system, 'Helvetica Neue', Helvetica, Arial, sans-serif";

const shell: React.CSSProperties = {
  position: 'relative',
  overflow: 'hidden',
  borderRadius: 6,
  aspectRatio: '5 / 7',
  display: 'flex',
  boxShadow: '0 1px 2px rgba(30,26,18,0.06), 0 18px 40px -14px rgba(30,26,18,0.22)',
  // Headline sizes below are expressed in `cqw` (percent of the card's own
  // width) so type scales with the card itself — the same card looks right
  // in the narrow form preview and at full width on the invite page.
  // This declaration is what makes the card the container they measure.
  containerType: 'inline-size',
};

// Headline type is large enough that a single long word would otherwise be
// clipped by the card's overflow:hidden rather than wrapping.
const WRAP: React.CSSProperties = { overflowWrap: 'break-word', wordBreak: 'break-word' };

/* ------------------------------------------------------------------ *
 * Copy model
 *
 * The heart of the rebuild. A real printed invitation is a *stack* of
 * typographic layers — a small kicker, the hero name, a date/time block,
 * the venue, a closing note — not a headline with one caption beneath it.
 * Every template below lays out these same fields; the purpose decides
 * what goes in them, so the host never composes card copy themselves.
 * ------------------------------------------------------------------ */
export interface Copy {
  eyebrow?: string;
  hero: string;
  heroScript?: string;
  hero2?: string;
  hero2Script?: string;
  dateLine?: string;
  timeLine?: string;
  venue?: string;
  closing?: string;
}

interface Props {
  theme: Theme;
  template: Template;
  purpose: Purpose;
  title: string;
  eventDate?: string | null;
  location?: string | null;
  customEyebrow?: string | null;
  customHeadline?: string | null;
  partner1?: string | null;
  partner2?: string | null;
  honoree?: string | null;
  closingLine?: string | null;
  photoUrl?: string | null;
  paperTexture?: boolean;
}

// Splits a name into a display "first" line and a script "rest" line —
// the "PAUL / keith" and "JARED / beck" treatment from the lavender
// wedding invite, where the surname is set in cursive under the big caps.
function splitName(full: string): { lead: string; script?: string } {
  const parts = full.trim().split(/\s+/);
  if (parts.length < 2) return { lead: full.trim() };
  return { lead: parts[0], script: parts.slice(1).join(' ') };
}

function formatDateParts(raw?: string | null): { dateLine?: string; timeLine?: string } {
  if (!raw) return {};
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return {};
  return {
    dateLine: d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
    timeLine: d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }),
  };
}

// Purpose → copy. This is what makes the presets presets: pick "Wedding"
// and the card already says "The Wedding Of" over both names, laid out the
// way the reference cards lay it out.
function buildCopy(p: Props): Copy {
  const { dateLine, timeLine } = formatDateParts(p.eventDate);
  const venue = p.location?.trim() || undefined;
  const closing = p.closingLine?.trim() || undefined;
  const base = { dateLine, timeLine, venue, closing };

  const a = p.partner1?.trim();
  const b = p.partner2?.trim();
  const honoree = p.honoree?.trim();
  const title = p.title?.trim() || 'Your event';

  // Two-name occasions render both names as co-equal heroes.
  const pair = (eyebrow: string): Copy => {
    if (a && b) {
      const n1 = splitName(a);
      const n2 = splitName(b);
      return { ...base, eyebrow, hero: n1.lead, heroScript: n1.script, hero2: n2.lead, hero2Script: n2.script };
    }
    return { ...base, eyebrow, hero: a || b || title };
  };

  switch (p.purpose) {
    case 'wedding':
      return pair('The Wedding Of');
    case 'save-the-date':
      return a || b ? pair('Save the Date') : { ...base, eyebrow: 'Save the Date', hero: title };
    case 'engagement':
      return a || b ? pair("It's Finally Happening") : { ...base, eyebrow: "It's Finally Happening", hero: title };
    case 'birthday':
      return { ...base, eyebrow: 'Please Join Us For', hero: honoree ? `${honoree}'s Birthday` : title };
    case 'shower':
      return { ...base, eyebrow: 'A Shower For', hero: honoree || title };
    case 'thank-you':
      return { ...base, eyebrow: 'With So Much Love', hero: 'Thank You!' };
    case 'custom':
      return { ...base, eyebrow: p.customEyebrow?.trim() || undefined, hero: p.customHeadline?.trim() || title };
    case 'invite':
    default:
      return { ...base, eyebrow: "You're Invited", hero: title };
  }
}

export default function InviteCard(props: Props) {
  const palette = paletteFor(props.theme);
  const copy = buildCopy(props);
  const shared = { palette, copy, paperTexture: props.paperTexture };

  switch (props.template) {
    case 'letterpress':
      return <Letterpress {...shared} />;
    case 'stacked-names':
      return <StackedNames {...shared} />;
    case 'script-announce':
      return <ScriptAnnounce {...shared} />;
    case 'bubble-doodle':
      return <BubbleDoodle {...shared} />;
    case 'marker-bold':
      return <MarkerBold {...shared} />;
    case 'poster':
      return <Poster {...shared} />;
    case 'arch':
      return <Arch {...shared} />;
    case 'ticket':
      return <Ticket {...shared} />;
    case 'photo':
      return <PhotoLed {...shared} photoUrl={props.photoUrl} />;
    case 'editorial':
    default:
      return <Editorial {...shared} />;
  }
}

type T = { palette: Palette; copy: Copy; paperTexture?: boolean };

/* ---------------------------- primitives ---------------------------- */

const PAPER_TEXTURE_URL = 'https://i.postimg.cc/Jzb7RKck/Texturelabs-Paper-178M.jpg';

// `overlay` is CSS's equivalent of Photoshop's Overlay blend mode — it
// multiplies the texture's darks and screens its lights, so a saturated
// card picks up grain instead of just going muddy the way `multiply` does.
function Texture({ on }: { on?: boolean }) {
  if (!on) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={PAPER_TEXTURE_URL}
      alt=""
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', mixBlendMode: 'overlay', pointerEvents: 'none' }}
    />
  );
}

function stableId(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return `p-${Math.abs(h)}`;
}

// Text curved along an arc via SVG <textPath> — the only dependable
// cross-browser way to bend a line of type without a canvas or an image.
// `dip` is how far the arc's midpoint rises above its ends. The SVG box is
// sized to hug the type: the baseline peaks at (height - dip), so the
// glyphs land just inside the top edge and no dead space is left beneath
// the curve — which is exactly what went wrong when the box was a fixed
// tall rectangle and the text floated at the top of it.
function ArcText({ text, color, id, fontFamily = DISPLAY, fontSize = 15, height = 62, dip = 20, letterSpacing = '0.12em' }: {
  text: string; color: string; id: string; fontFamily?: string; fontSize?: number; height?: number; dip?: number; letterSpacing?: string;
}) {
  return (
    <svg viewBox={`0 0 320 ${height}`} width="100%" height={height} style={{ display: 'block', overflow: 'visible' }}>
      <path id={id} d={`M 12 ${height} Q 160 ${height - 2 * dip} 308 ${height}`} fill="none" />
      <text fontFamily={fontFamily} fontSize={fontSize} fill={color} letterSpacing={letterSpacing}>
        <textPath href={`#${id}`} startOffset="50%" textAnchor="middle">{text.toUpperCase()}</textPath>
      </text>
    </svg>
  );
}

function FlowerDoodle({ color, size = 26, rotate = 0 }: { color: string; size?: number; rotate?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" style={{ display: 'block', transform: `rotate(${rotate}deg)` }}>
      <g stroke={color} strokeWidth="2.4" strokeLinecap="round" fill="none">
        <circle cx="20" cy="11" r="7.5" />
        <circle cx="29" cy="20" r="7.5" />
        <circle cx="20" cy="29" r="7.5" />
        <circle cx="11" cy="20" r="7.5" />
      </g>
    </svg>
  );
}

// Small tracked caps — the workhorse for eyebrows and detail lines.
function Caps({ children, color, size = 11, weight = 600, tracking = '0.18em', style }: {
  children: React.ReactNode; color: string; size?: number; weight?: number; tracking?: string; style?: React.CSSProperties;
}) {
  return (
    <div style={{ fontFamily: SANS, fontSize: size, fontWeight: weight, letterSpacing: tracking, textTransform: 'uppercase', color, lineHeight: 1.5, ...style }}>
      {children}
    </div>
  );
}

// The layered footer every real invitation has: when, where, and the
// closing note. Rendering this consistently is most of what separates
// these cards from a headline floating in whitespace.
function DetailStack({ copy, color, align = 'center', rule, gap = 3 }: {
  copy: Copy; color: string; align?: 'center' | 'left'; rule?: boolean; gap?: number;
}) {
  const { dateLine, timeLine, venue, closing } = copy;
  if (!dateLine && !timeLine && !venue && !closing) return null;
  return (
    <div style={{ textAlign: align, display: 'flex', flexDirection: 'column', gap, alignItems: align === 'center' ? 'center' : 'flex-start' }}>
      {rule && <div style={{ width: 34, height: 1, background: color, opacity: 0.45, margin: align === 'center' ? '0 auto 8px' : '0 0 8px' }} />}
      {dateLine && <Caps color={color} size={10.5} tracking="0.14em">{dateLine}</Caps>}
      {timeLine && <Caps color={color} size={10.5} tracking="0.14em">{`at ${timeLine}`}</Caps>}
      {venue && <Caps color={color} size={10.5} weight={700} tracking="0.14em" style={{ marginTop: 4 }}>{venue}</Caps>}
      {closing && (
        <div style={{ fontFamily: SCRIPT, fontSize: 17, color, opacity: 0.9, marginTop: 8, lineHeight: 1.3 }}>{closing}</div>
      )}
    </div>
  );
}

/* ---------------------------- templates ---------------------------- */

// Modelled on the "PLEASE JOIN US TO CELEBRATE / CORRIE" letterpress card:
// an arced kicker over huge debossed display caps, tone-on-tone on tinted
// paper, with the impression faked by a soft dual text-shadow.
function Letterpress({ palette, copy, paperTexture }: T) {
  const { paper, paperInk } = palette;
  const emboss = '0 1px 0 rgba(255,255,255,0.75), 0 -1px 1px rgba(0,0,0,0.16)';
  return (
    <div style={{ ...shell, background: paper, color: paperInk, alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <div style={{ padding: '10% 8%', width: '100%' }}>
        {copy.eyebrow && (
          <div style={{ marginBottom: 6, textShadow: emboss }}>
            <ArcText text={copy.eyebrow} color={paperInk} id={stableId(`lp${copy.eyebrow}`)} fontSize={13} height={34} dip={9} />
          </div>
        )}
        <div style={{ fontFamily: DISPLAY, fontSize: 'clamp(34px, 15cqw, 62px)', lineHeight: 0.95, textTransform: 'uppercase', textShadow: emboss, ...WRAP }}>
          {copy.hero}
        </div>
        {copy.hero2 && (
          <>
            <div style={{ fontFamily: SCRIPT, fontSize: 20, margin: '2px 0', textShadow: emboss }}>and</div>
            <div style={{ fontFamily: DISPLAY, fontSize: 'clamp(34px, 15cqw, 62px)', lineHeight: 0.95, textTransform: 'uppercase', textShadow: emboss, ...WRAP }}>
              {copy.hero2}
            </div>
          </>
        )}
        <div style={{ marginTop: 22, textShadow: emboss }}>
          <DetailStack copy={copy} color={paperInk} rule />
        </div>
      </div>
      <Texture on={paperTexture} />
    </div>
  );
}

// Modelled on the lavender "THE WEDDING OF / PAUL keith + JARED beck" card:
// big serif caps with a cursive surname tucked beneath each, then a date
// block with the day and year flanking the time and venue.
function StackedNames({ palette, copy, paperTexture }: T) {
  const { paper, paperInk } = palette;
  return (
    <div style={{ ...shell, background: paper, color: paperInk, alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <div style={{ padding: '9% 8%', width: '100%' }}>
        {copy.eyebrow && <Caps color={paperInk} size={11} style={{ marginBottom: 14 }}>{copy.eyebrow}</Caps>}

        <div style={{ fontFamily: SERIF, fontSize: 'clamp(30px, 13cqw, 52px)', fontWeight: 600, lineHeight: 0.98, textTransform: 'uppercase', ...WRAP }}>
          {copy.hero}
        </div>
        {copy.heroScript && <div style={{ fontFamily: SCRIPT, fontSize: 26, lineHeight: 1.1, marginTop: 2 }}>{copy.heroScript}</div>}

        {copy.hero2 && (
          <>
            <div style={{ fontSize: 20, margin: '10px 0', opacity: 0.75 }}>+</div>
            <div style={{ fontFamily: SERIF, fontSize: 'clamp(30px, 13cqw, 52px)', fontWeight: 600, lineHeight: 0.98, textTransform: 'uppercase', ...WRAP }}>
              {copy.hero2}
            </div>
            {copy.hero2Script && <div style={{ fontFamily: SCRIPT, fontSize: 26, lineHeight: 1.1, marginTop: 2 }}>{copy.hero2Script}</div>}
          </>
        )}

        {(copy.dateLine || copy.timeLine || copy.venue) && (
          <div style={{ marginTop: 24, paddingTop: 14, borderTop: `1px solid ${paperInk}33`, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {copy.dateLine && <Caps color={paperInk} size={11} weight={700} tracking="0.16em">{copy.dateLine}</Caps>}
            {copy.timeLine && <Caps color={paperInk} size={11} tracking="0.16em">{`at ${copy.timeLine}`}</Caps>}
            {copy.venue && <div style={{ fontFamily: SCRIPT, fontSize: 22, marginTop: 4 }}>{copy.venue}</div>}
          </div>
        )}
        {copy.closing && <Caps color={paperInk} size={10} style={{ marginTop: 12, opacity: 0.85 }}>{copy.closing}</Caps>}
      </div>
      <Texture on={paperTexture} />
    </div>
  );
}

// Modelled on the orange "IT'S FINALLY HAPPENING / Natalie and Adriano are
// engaged!" card: a tightly tracked kicker, a big cursive hero, then a
// small-caps detail stack.
function ScriptAnnounce({ palette, copy, paperTexture }: T) {
  const { accent } = palette;
  const heroText = copy.hero2 ? `${copy.hero} and ${copy.hero2}` : copy.hero;
  return (
    <div style={{ ...shell, background: CREAM, color: accent, alignItems: 'center', justifyContent: 'center', textAlign: 'center', border: '1px solid rgba(43,40,34,0.08)' }}>
      <div style={{ padding: '10% 9%', width: '100%' }}>
        {copy.eyebrow && <Caps color={accent} size={11} tracking="0.22em" style={{ marginBottom: 22 }}>{copy.eyebrow}</Caps>}
        <div style={{ fontFamily: SCRIPT, fontSize: 'clamp(34px, 14cqw, 56px)', lineHeight: 1.12, ...WRAP }}>{heroText}</div>
        <div style={{ marginTop: 26 }}>
          <DetailStack copy={copy} color={accent} />
        </div>
      </div>
      <Texture on={paperTexture} />
    </div>
  );
}

// Modelled on the "STEVIE JONES ✿ AND ✿ HAYDEN SMITH" card: chunky rounded
// hand-lettered caps in a hot accent on cream, with loose flower doodles
// scattered into the margins.
function BubbleDoodle({ palette, copy, paperTexture }: T) {
  const hero = palette.accent;
  return (
    <div style={{ ...shell, background: CREAM, color: hero, alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <div style={{ position: 'absolute', top: '7%', left: '7%' }}><FlowerDoodle color={hero} size={30} rotate={-12} /></div>
      <div style={{ position: 'absolute', top: '16%', right: '9%' }}><FlowerDoodle color={hero} size={22} rotate={16} /></div>
      <div style={{ position: 'absolute', bottom: '9%', left: '12%' }}><FlowerDoodle color={hero} size={24} rotate={24} /></div>
      <div style={{ padding: '13% 9%', width: '100%' }}>
        {copy.eyebrow && <Caps color={hero} size={11} tracking="0.16em" style={{ marginBottom: 12 }}>{copy.eyebrow}</Caps>}
        <div style={{ fontFamily: ROUND, fontSize: 'clamp(30px, 13cqw, 50px)', lineHeight: 1.0, textTransform: 'uppercase', ...WRAP }}>
          {copy.hero}
        </div>
        {copy.hero2 && (
          <>
            <div style={{ fontFamily: ROUND, fontSize: 18, textTransform: 'uppercase', margin: '4px 0' }}>and</div>
            <div style={{ fontFamily: ROUND, fontSize: 'clamp(30px, 13cqw, 50px)', lineHeight: 1.0, textTransform: 'uppercase', ...WRAP }}>
              {copy.hero2}
            </div>
          </>
        )}
        <div style={{ marginTop: 22 }}>
          <DetailStack copy={copy} color={hero} />
        </div>
      </div>
      <Texture on={paperTexture} />
    </div>
  );
}

// Modelled on the red "You're INVITED TO THE WEDDING OF" card: thick,
// slightly wonky marker lettering on a saturated ground, with the kicker
// broken across lines at mixed sizes the way hand-lettering falls.
function MarkerBold({ palette, copy, paperTexture }: T) {
  const { bg, ink } = palette;
  const words = (copy.eyebrow || '').split(' ');
  return (
    <div style={{ ...shell, background: bg, color: ink, alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <div style={{ padding: '11% 8%', width: '100%' }}>
        {copy.eyebrow && (
          <div style={{ fontFamily: MARKER, lineHeight: 1.08, marginBottom: 16 }}>
            {words.map((w, i) => (
              <span
                key={i}
                style={{
                  display: 'inline-block',
                  margin: '0 5px',
                  // Alternating scale + a degree of tilt is what sells the
                  // hand-lettered look; both are deterministic functions of
                  // the word index, never Math.random, so the server and
                  // client always render the same thing.
                  fontSize: i % 3 === 1 ? 30 : 22,
                  transform: `rotate(${((i * 37) % 5) - 2}deg)`,
                }}
              >
                {w}
              </span>
            ))}
          </div>
        )}
        <div style={{ fontFamily: MARKER, fontSize: 'clamp(30px, 14cqw, 52px)', lineHeight: 1.12, transform: 'rotate(-1deg)', ...WRAP }}>
          {copy.hero2 ? `${copy.hero} & ${copy.hero2}` : copy.hero}
        </div>
        <div style={{ marginTop: 24 }}>
          <DetailStack copy={copy} color={ink} rule />
        </div>
      </div>
      <Texture on={paperTexture} />
    </div>
  );
}

// A saturated block with the headline set as large as it will go — the
// loudest option in the set.
function Poster({ palette, copy, paperTexture }: T) {
  const { bg, ink } = palette;
  return (
    <div style={{ ...shell, background: bg, color: ink, flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div style={{ padding: '9%', width: '100%' }}>
        {copy.eyebrow && <Caps color={ink} size={12} weight={700} tracking="0.14em" style={{ marginBottom: 12 }}>{copy.eyebrow}</Caps>}
        <div style={{ fontFamily: SANS, fontSize: 'clamp(34px, 17cqw, 74px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 0.86, textTransform: 'uppercase', ...WRAP }}>
          {copy.hero2 ? `${copy.hero} & ${copy.hero2}` : copy.hero}
        </div>
        <div style={{ marginTop: 20, paddingTop: 14, borderTop: `1px solid ${ink}44` }}>
          <DetailStack copy={copy} color={ink} align="left" gap={2} />
        </div>
      </div>
      <Texture on={paperTexture} />
    </div>
  );
}

// Quiet and type-led: hairline rules, a serif hero, generous air.
function Editorial({ palette, copy, paperTexture }: T) {
  const { accent } = palette;
  const INKC = '#2B2822';
  return (
    <div style={{ ...shell, background: CREAM, color: INKC, alignItems: 'center', justifyContent: 'center', textAlign: 'center', border: '1px solid rgba(43,40,34,0.1)' }}>
      <div style={{ padding: '10% 9%', width: '100%' }}>
        {copy.eyebrow && <Caps color={accent} size={11} tracking="0.2em" style={{ marginBottom: 18 }}>{copy.eyebrow}</Caps>}
        <div style={{ fontFamily: SERIF, fontSize: 'clamp(28px, 12cqw, 46px)', fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1.06, ...WRAP }}>
          {copy.hero}
        </div>
        {copy.hero2 && (
          <>
            <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 20, margin: '6px 0', color: accent }}>and</div>
            <div style={{ fontFamily: SERIF, fontSize: 'clamp(28px, 12cqw, 46px)', fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1.06, ...WRAP }}>
              {copy.hero2}
            </div>
          </>
        )}
        <div style={{ width: 44, height: 1, background: accent, margin: '22px auto' }} />
        <DetailStack copy={copy} color={'#7A7568'} />
      </div>
      <Texture on={paperTexture} />
    </div>
  );
}

// The hero curved along an arc over a tinted ground.
function Arch({ palette, copy, paperTexture }: T) {
  const { paper, paperInk } = palette;
  return (
    <div style={{ ...shell, background: paper, color: paperInk, alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <div style={{ padding: '9% 7%', width: '100%' }}>
        {copy.eyebrow && <Caps color={paperInk} size={11} style={{ marginBottom: 14 }}>{copy.eyebrow}</Caps>}
        <ArcText text={copy.hero} color={paperInk} id={stableId(`ar${copy.hero}`)} fontSize={40} height={80} dip={26} letterSpacing="1" />
        {copy.hero2 && (
          <div style={{ fontFamily: DISPLAY, fontSize: 34, textTransform: 'uppercase', marginTop: 6, ...WRAP }}>& {copy.hero2}</div>
        )}
        <div style={{ marginTop: 20 }}>
          <DetailStack copy={copy} color={paperInk} rule />
        </div>
      </div>
      <Texture on={paperTexture} />
    </div>
  );
}

// A bordered badge with a notched edge, like a printed event ticket.
function Ticket({ palette, copy, paperTexture }: T) {
  const { accent } = palette;
  const INKC = '#2B2822';
  return (
    <div style={{ ...shell, background: CREAM, color: INKC, padding: '5%' }}>
      {/* The rule is inset from the card edge like a printed ticket, so it
          fills the full height rather than floating in the middle. */}
      <div
        style={{
          border: `1.5px solid ${accent}`,
          borderRadius: 10,
          padding: '8%',
          width: '100%',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        {copy.eyebrow && <Caps color={accent} size={11} style={{ marginBottom: 14 }}>{copy.eyebrow}</Caps>}
        <div style={{ fontFamily: DISPLAY, fontSize: 'clamp(28px, 12cqw, 46px)', lineHeight: 1.0, textTransform: 'uppercase', ...WRAP }}>
          {copy.hero2 ? `${copy.hero} & ${copy.hero2}` : copy.hero}
        </div>
        <div style={{ margin: '18px 0 14px', borderTop: `1px dashed ${accent}88` }} />
        <DetailStack copy={copy} color={accent} />
      </div>
      <Texture on={paperTexture} />
    </div>
  );
}

// Photo up top under a softly waved edge, detail stack below.
function PhotoLed({ palette, copy, paperTexture, photoUrl }: T & { photoUrl?: string | null }) {
  const { accent } = palette;
  const INKC = '#2B2822';
  return (
    <div style={{ ...shell, background: CREAM, color: INKC, flexDirection: 'column', border: '1px solid rgba(43,40,34,0.1)' }}>
      <div style={{ borderRadius: '0 0 50% 50% / 0 0 32px 32px', overflow: 'hidden', height: '52%', background: `${accent}33`, flexShrink: 0 }}>
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FlowerDoodle color={accent} size={34} />
          </div>
        )}
      </div>
      <div style={{ padding: '7% 8%', textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {copy.eyebrow && <Caps color={accent} size={10.5} style={{ marginBottom: 8 }}>{copy.eyebrow}</Caps>}
        <div style={{ fontFamily: SERIF, fontSize: 'clamp(22px, 9cqw, 34px)', fontWeight: 500, lineHeight: 1.08, ...WRAP }}>
          {copy.hero2 ? `${copy.hero} & ${copy.hero2}` : copy.hero}
        </div>
        <div style={{ width: 34, height: 1, background: accent, margin: '14px auto' }} />
        <DetailStack copy={copy} color={'#7A7568'} />
      </div>
      <Texture on={paperTexture} />
    </div>
  );
}
