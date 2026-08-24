'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import InviteCard from '@/components/InviteCard';
import { Purpose, Template, Theme } from '@/lib/supabase';

const THEMES: { value: Theme; swatch: string; label: string }[] = [
  { value: 'lime', swatch: '#B7CE4E', label: 'Lime' },
  { value: 'sage', swatch: '#A3B98C', label: 'Sage' },
  { value: 'forest', swatch: '#23412C', label: 'Forest' },
  { value: 'olive', swatch: '#8A9440', label: 'Olive' },
  { value: 'coral', swatch: '#F0906A', label: 'Coral' },
  { value: 'terracotta', swatch: '#C4613F', label: 'Terracotta' },
  { value: 'orange', swatch: '#F4551E', label: 'Orange' },
  { value: 'tomato', swatch: '#E23B2C', label: 'Tomato' },
  { value: 'blush', swatch: '#F2B4C6', label: 'Blush' },
  { value: 'hotpink', swatch: '#E8538C', label: 'Hot pink' },
  { value: 'lavender', swatch: '#AEA2EE', label: 'Lavender' },
  { value: 'grape', swatch: '#6B54B8', label: 'Grape' },
  { value: 'mustard', swatch: '#E6B23C', label: 'Mustard' },
  { value: 'butter', swatch: '#F3DC91', label: 'Butter' },
  { value: 'ink', swatch: '#22201A', label: 'Ink' },
  { value: 'cream', swatch: '#EFE7D6', label: 'Cream' },
];

// Each purpose declares which extra fields the form should ask for, so
// picking "Wedding" surfaces two name fields and picking "Birthday"
// surfaces the guest-of-honor field — the form follows the occasion.
type ExtraField = 'names' | 'honoree' | 'custom';
const PURPOSES: { value: Purpose; label: string; hint: string; extra?: ExtraField }[] = [
  { value: 'invite', label: "You're Invited", hint: 'General invitation' },
  { value: 'wedding', label: 'Wedding', hint: 'Two names, "The Wedding Of"', extra: 'names' },
  { value: 'save-the-date', label: 'Save the Date', hint: 'Advance notice', extra: 'names' },
  { value: 'engagement', label: 'Engagement', hint: '"It\'s finally happening"', extra: 'names' },
  { value: 'birthday', label: 'Birthday', hint: 'Guest of honor', extra: 'honoree' },
  { value: 'shower', label: 'Shower', hint: 'Baby or bridal', extra: 'honoree' },
  { value: 'thank-you', label: 'Thank You!', hint: 'After the event' },
  { value: 'custom', label: 'Custom', hint: 'Write your own lines', extra: 'custom' },
];

const TEMPLATES: { value: Template; label: string; hint: string }[] = [
  { value: 'letterpress', label: 'Letterpress', hint: 'Arced kicker, debossed display caps' },
  { value: 'stacked-names', label: 'Stacked Names', hint: 'Big caps + cursive surname' },
  { value: 'script-announce', label: 'Script', hint: 'Tracked kicker, big cursive line' },
  { value: 'bubble-doodle', label: 'Bubble & Doodles', hint: 'Rounded caps, flower doodles' },
  { value: 'marker-bold', label: 'Marker', hint: 'Hand-marker caps on color' },
  { value: 'poster', label: 'Poster', hint: 'Huge condensed type on color' },
  { value: 'editorial', label: 'Editorial', hint: 'Quiet serif, hairline rules' },
  { value: 'arch', label: 'Arch', hint: 'Headline curved on an arc' },
  { value: 'ticket', label: 'Ticket', hint: 'Bordered badge, dashed rule' },
  { value: 'photo', label: 'Photo', hint: 'Photo up top, details below' },
];

export default function CreateEventPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [mapQuery, setMapQuery] = useState('');
  const [hostEmail, setHostEmail] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [theme, setTheme] = useState<Theme>('lime');
  const [template, setTemplate] = useState<Template>('letterpress');
  const [purpose, setPurpose] = useState<Purpose>('invite');
  const [customEyebrow, setCustomEyebrow] = useState('');
  const [customHeadline, setCustomHeadline] = useState('');
  const [partner1, setPartner1] = useState('');
  const [partner2, setPartner2] = useState('');
  const [honoree, setHonoree] = useState('');
  const [closingLine, setClosingLine] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [paperTexture, setPaperTexture] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const extra = PURPOSES.find((p) => p.value === purpose)?.extra;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!title || !eventDate) {
      setError('Title and date are required.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          location,
          map_query: mapQuery,
          host_email: hostEmail,
          event_date: eventDate,
          theme,
          template,
          purpose,
          custom_eyebrow: customEyebrow,
          custom_headline: customHeadline,
          partner1,
          partner2,
          honoree,
          closing_line: closingLine,
          photo_url: template === 'photo' ? photoUrl : null,
          paper_texture: paperTexture,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong.');
        return;
      }
      router.push(`/dashboard/${data.edit_token}`);
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="builder-page">
      <h1 style={{ fontSize: 24, marginBottom: 4 }}>New event</h1>
      <p className="muted" style={{ marginBottom: 24 }}>
        Fill in the details, then share the link with your guests.
      </p>

      <div className="builder">
        {/* ---------------------------- form ---------------------------- */}
        <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="field-group">
            <label>Event title</label>
            <input placeholder="e.g. Sam's birthday" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="field-group">
            <label>Occasion</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8 }}>
              {PURPOSES.map((p) => (
                <button
                  type="button"
                  key={p.value}
                  onClick={() => setPurpose(p.value)}
                  className={purpose === p.value ? 'btn-active' : ''}
                  style={{ textAlign: 'left', padding: '10px 12px' }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{p.label}</div>
                  <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>{p.hint}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Fields that appear because of the occasion picked above. */}
          {extra === 'names' && (
            <div className="field-group">
              <label>The two of you</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <input placeholder="First & last name" value={partner1} onChange={(e) => setPartner1(e.target.value)} />
                <input placeholder="First & last name" value={partner2} onChange={(e) => setPartner2(e.target.value)} />
              </div>
              <p className="muted" style={{ margin: '4px 0 0', fontSize: 12 }}>
                Include surnames and some styles will set them in cursive beneath the first names, like a printed
                wedding invitation.
              </p>
            </div>
          )}

          {extra === 'honoree' && (
            <div className="field-group">
              <label>Guest of honor</label>
              <input placeholder="Who's being celebrated?" value={honoree} onChange={(e) => setHonoree(e.target.value)} />
            </div>
          )}

          {extra === 'custom' && (
            <>
              <div className="field-group">
                <label>Small line on top</label>
                <input
                  placeholder="e.g. Please join us for"
                  value={customEyebrow}
                  onChange={(e) => setCustomEyebrow(e.target.value)}
                />
              </div>
              <div className="field-group">
                <label>Big headline</label>
                <input
                  placeholder="e.g. It's a Girl! / Happy Retirement!"
                  value={customHeadline}
                  onChange={(e) => setCustomHeadline(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="field-group">
            <label>Date and time</label>
            <input type="datetime-local" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
          </div>

          <div className="field-group">
            <label>Location</label>
            <input placeholder="Shown on the card" value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>

          <div className="field-group">
            <label>Exact address or pin for the map</label>
            <input
              placeholder="Optional — only if the location above is informal"
              value={mapQuery}
              onChange={(e) => setMapQuery(e.target.value)}
            />
            <p className="muted" style={{ margin: '4px 0 0', fontSize: 12 }}>
              The map embedded on the invite page uses this if you fill it in, otherwise it uses the location above.
            </p>
          </div>

          <div className="field-group">
            <label>Closing line</label>
            <input
              placeholder="e.g. Dinner & dancing to follow"
              value={closingLine}
              onChange={(e) => setClosingLine(e.target.value)}
            />
            <p className="muted" style={{ margin: '4px 0 0', fontSize: 12 }}>
              Printed at the foot of the card, in cursive on most styles.
            </p>
          </div>

          <div className="field-group">
            <label>Description</label>
            <textarea placeholder="Extra details for guests (shown under the card, not on it)" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div className="field-group">
            <label>Your email</label>
            <input
              type="email"
              placeholder="We'll send you the dashboard link"
              value={hostEmail}
              onChange={(e) => setHostEmail(e.target.value)}
            />
          </div>

          <div className="field-group">
            <label>Color</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {THEMES.map((t) => (
                <button
                  type="button"
                  key={t.value}
                  onClick={() => setTheme(t.value)}
                  aria-label={t.label}
                  title={t.label}
                  style={{
                    width: 32,
                    height: 32,
                    padding: 0,
                    borderRadius: 8,
                    background: t.swatch,
                    border: theme === t.value ? '2px solid #1C1C1A' : '1px solid var(--border)',
                    outline: theme === t.value ? '2px solid var(--accent)' : 'none',
                    outlineOffset: 1,
                  }}
                />
              ))}
            </div>
          </div>

          <div className="field-group">
            <label>Card style</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8 }}>
              {TEMPLATES.map((t) => (
                <button
                  type="button"
                  key={t.value}
                  onClick={() => setTemplate(t.value)}
                  className={template === t.value ? 'btn-active' : ''}
                  style={{ textAlign: 'left', padding: '10px 12px' }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{t.label}</div>
                  <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>{t.hint}</div>
                </button>
              ))}
            </div>
          </div>

          {template === 'photo' && (
            <div className="field-group">
              <label>Photo URL</label>
              <input placeholder="Paste an image link" value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} />
            </div>
          )}

          <div className="field-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={paperTexture}
                onChange={(e) => setPaperTexture(e.target.checked)}
                style={{ width: 'auto' }}
              />
              Paper texture
            </label>
            <p className="muted" style={{ margin: '2px 0 0', fontSize: 12 }}>
              Blends a subtle paper grain over the card. Works with any style.
            </p>
          </div>

          {error && <div className="error-text">{error}</div>}

          <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: 4 }}>
            {loading ? 'Creating…' : 'Create event'}
          </button>
        </form>

        {/* -------------------------- live preview -------------------------- */}
        <div className="builder-preview">
          <label style={{ display: 'block', marginBottom: 8 }}>Preview</label>
          <InviteCard
            theme={theme}
            template={template}
            purpose={purpose}
            title={title || 'Your event title'}
            eventDate={eventDate}
            location={location}
            customEyebrow={customEyebrow}
            customHeadline={customHeadline}
            partner1={partner1}
            partner2={partner2}
            honoree={honoree}
            closingLine={closingLine}
            photoUrl={photoUrl}
            paperTexture={paperTexture}
          />
        </div>
      </div>
    </main>
  );
}
