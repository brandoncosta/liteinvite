'use client';

import { useState } from 'react';
import { RsvpStatus } from '@/lib/supabase';

export default function RsvpForm({
  viewToken,
  guestToken,
  prefillName,
  prefillEmail,
}: {
  viewToken: string;
  guestToken?: string;
  prefillName?: string;
  prefillEmail?: string;
}) {
  const [name, setName] = useState(prefillName || '');
  const [email, setEmail] = useState(prefillEmail || '');
  const [status, setStatus] = useState<RsvpStatus | null>(null);
  const [plusOnes, setPlusOnes] = useState(0);
  const [note, setNote] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!name || !status) {
      setError('Enter your name and pick yes, no, or maybe.');
      return;
    }
    setLoading(true);
    const res = await fetch('/api/rsvp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ view_token: viewToken, name, email, status, plus_ones: plusOnes, note, guest_token: guestToken }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Something went wrong.');
      return;
    }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="card">
        <p style={{ margin: 0 }}>Thanks, {name} — your response is in.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="field-group">
        <label>Your name</label>
        <input placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      <div className="field-group">
        <label>Email</label>
        <input placeholder="Optional, for updates" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>

      <div className="field-group">
        <label>Will you be there?</label>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['yes', 'maybe', 'no'] as RsvpStatus[]).map((s) => (
            <button
              type="button"
              key={s}
              onClick={() => setStatus(s)}
              className={status === s ? 'btn-active' : ''}
              style={{ flex: 1, textTransform: 'capitalize' }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {status === 'yes' && (
        <div className="field-group" style={{ maxWidth: 120 }}>
          <label>Plus ones</label>
          <input type="number" min={0} value={plusOnes} onChange={(e) => setPlusOnes(Number(e.target.value))} />
        </div>
      )}

      <div className="field-group">
        <label>Note</label>
        <textarea placeholder="Optional" value={note} onChange={(e) => setNote(e.target.value)} />
      </div>

      {error && <div className="error-text">{error}</div>}

      <button type="submit" disabled={loading} className="btn-primary">
        {loading ? 'Sending…' : 'Send response'}
      </button>
    </form>
  );
}
