'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import InviteCard from '@/components/InviteCard';
import { Purpose, Template, Theme } from '@/lib/supabase';

const THEMES: Theme[] = ['teal', 'coral', 'purple', 'pink', 'amber'];
const THEME_SWATCH: Record<Theme, string> = {
  teal: '#5DCAA5',
  coral: '#F0997B',
  purple: '#AFA9EC',
  pink: '#ED93B1',
  amber: '#EF9F27',
};
const PURPOSES: { value: Purpose; label: string; hint: string }[] = [
  { value: 'invite', label: "You're Invited", hint: 'Your event title is the headline' },
  { value: 'save-the-date', label: 'Save the Date', hint: 'Fixed headline — your details become a caption' },
  { value: 'thank-you', label: 'Thank You!', hint: 'Fixed headline — your details become a caption' },
];
const TEMPLATES: { value: Template; label: string; hint: string }[] = [
  { value: 'editorial', label: 'Editorial', hint: 'Quiet serif type, one thin rule' },
  { value: 'poster', label: 'Poster', hint: 'Bold, saturated, big headline' },
  { value: 'linework', label: 'Line-art', hint: 'Italic serif, hand-drawn squiggle' },
  { value: 'stacked', label: 'Stacked type', hint: 'Big mirrored type — great for thank-yous' },
  { value: 'photo', label: 'Photo', hint: 'Photo up top, caption below' },
  { value: 'arch', label: 'Arch', hint: 'Headline curved along an arc' },
  { value: 'ticket', label: 'Ticket', hint: 'Bordered badge with a pill detail' },
  { value: 'script', label: 'Script', hint: 'Cursive headline on solid color' },
  { value: 'bubble', label: 'Bubble', hint: 'Chunky rounded caps on solid color' },
  { value: 'scatter', label: 'Scatter', hint: 'Jumbled, playfully rotated letters' },
  { value: 'letterpress', label: 'Letterpress', hint: 'Debossed tone-on-tone type' },
];

export default function CreateEventPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [mapQuery, setMapQuery] = useState('');
  const [hostEmail, setHostEmail] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [theme, setTheme] = useState<Theme>('teal');
  const [template, setTemplate] = useState<Template>('editorial');
  const [purpose, setPurpose] = useState<Purpose>('invite');
  const [photoUrl, setPhotoUrl] = useState('');
  const [paperTexture, setPaperTexture] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!title || !eventDate) {
      setError('Title and date are required.');
      return;
    }
    setLoading(true);
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
        photo_url: template === 'photo' ? photoUrl : null,
        paper_texture: paperTexture,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || 'Something went wrong.');
      return;
    }
    router.push(`/dashboard/${data.edit_token}`);
  }

  return (
    <main style={{ maxWidth: 480, margin: '0 auto', padding: '3rem 1.25rem' }}>
      <h1 style={{ fontSize: 24, marginBottom: 4 }}>New event</h1>
      <p className="muted" style={{ marginBottom: 24 }}>
        Fill in the details, then share the link with your guests.
      </p>

      <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="field-group">
          <label>Event title</label>
          <input placeholder="e.g. Sam's birthday" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div className="field-group">
          <label>Description</label>
          <textarea placeholder="Optional details for guests" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <div className="field-group">
          <label>Location</label>
          <input placeholder="Optional" value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>

        <div className="field-group">
          <label>Exact address or pin for directions</label>
          <input
            placeholder="Optional — only needed if the location above is informal"
            value={mapQuery}
            onChange={(e) => setMapQuery(e.target.value)}
          />
          <p className="muted" style={{ margin: '4px 0 0', fontSize: 12 }}>
            The "Get directions" link uses this if you fill it in, otherwise it uses the location above. For a
            precise pin, open Google Maps, find the spot, and paste the address or coordinates it shows.
          </p>
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
          <label>Date and time</label>
          <input type="datetime-local" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
        </div>

        <div className="field-group">
          <label>Color</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {THEMES.map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => setTheme(t)}
                aria-label={t}
                style={{
                  width: 34,
                  height: 34,
                  padding: 0,
                  borderRadius: 8,
                  background: THEME_SWATCH[t],
                  border: theme === t ? '2px solid #1C1C1A' : '1px solid var(--border)',
                }}
              />
            ))}
          </div>
        </div>

        <div className="field-group">
          <label>Purpose</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
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

        <div className="field-group">
          <label>Card style</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
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
            Blends a subtle paper-grain finish over the card. Works with any style above.
          </p>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 8 }}>Preview</label>
          <InviteCard
            theme={theme}
            template={template}
            purpose={purpose}
            title={title || 'Your event title'}
            subtitle={location}
            photoUrl={photoUrl}
            paperTexture={paperTexture}
          />
        </div>

        {error && <div className="error-text">{error}</div>}

        <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: 4 }}>
          {loading ? 'Creating…' : 'Create event'}
        </button>
      </form>
    </main>
  );
}
