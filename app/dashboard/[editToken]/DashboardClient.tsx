'use client';

import { useEffect, useState } from 'react';
import { EventRecord, GuestRecord, RsvpRecord, RsvpStatus } from '@/lib/supabase';
import CopyLink from '@/components/CopyLink';
import GuestListManager from './GuestListManager';

const GROUP_LABELS: Record<RsvpStatus, string> = { yes: 'Yes', maybe: 'Maybe', no: 'No' };

export default function DashboardClient({
  event,
  rsvps,
  guests,
}: {
  event: EventRecord;
  rsvps: RsvpRecord[];
  guests: GuestRecord[];
}) {
  const [tab, setTab] = useState<'invite' | 'guests' | 'update' | 'thankyou'>('invite');
  const grouped: Record<RsvpStatus, RsvpRecord[]> = {
    yes: rsvps.filter((r) => r.status === 'yes'),
    maybe: rsvps.filter((r) => r.status === 'maybe'),
    no: rsvps.filter((r) => r.status === 'no'),
  };

  // Computed after mount, not during render — window isn't available on the
  // server, so setting this during render caused a server/client mismatch.
  const [viewUrl, setViewUrl] = useState('');
  useEffect(() => {
    setViewUrl(`${window.location.origin}/e/${event.view_token}`);
  }, [event.view_token]);

  return (
    <main style={{ maxWidth: 560, margin: '0 auto', padding: '3rem 1.25rem' }}>
      <h1 style={{ fontSize: 24, marginBottom: 12 }}>{event.title}</h1>
      <div style={{ marginBottom: 20 }}>
        {viewUrl && <CopyLink url={viewUrl} label="Share with guests:" />}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 16, flexWrap: 'wrap' }}>
        <button onClick={() => setTab('invite')} className={tab === 'invite' ? 'btn-active' : ''}>
          Invite list ({guests.length})
        </button>
        <button onClick={() => setTab('guests')} className={tab === 'guests' ? 'btn-active' : ''}>
          RSVPs ({rsvps.length})
        </button>
        <button onClick={() => setTab('update')} className={tab === 'update' ? 'btn-active' : ''}>
          Send update
        </button>
        <button onClick={() => setTab('thankyou')} className={tab === 'thankyou' ? 'btn-active' : ''}>
          Thank you cards
        </button>
      </div>

      {tab === 'invite' && <GuestListManager editToken={event.edit_token} guests={guests} />}

      {tab === 'guests' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {(['yes', 'maybe', 'no'] as RsvpStatus[]).map((status) => (
            <div key={status} className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span className="tag">{GROUP_LABELS[status]}</span>
                <span className="muted">{grouped[status].length}</span>
              </div>
              {grouped[status].length === 0 && <div className="muted">No one yet.</div>}
              {grouped[status].map((r) => (
                <div key={r.id} style={{ fontSize: 14, padding: '10px 0', borderTop: '1px solid var(--border)' }}>
                  <div>
                    {r.name}
                    {r.plus_ones > 0 && ` +${r.plus_ones}`}
                  </div>
                  {r.email && <div className="muted">{r.email}</div>}
                  {r.note && <div className="muted" style={{ marginTop: 2 }}>{r.note}</div>}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {tab === 'update' && <UpdateForm editToken={event.edit_token} />}
      {tab === 'thankyou' && <ThankYouForm editToken={event.edit_token} guests={grouped.yes} />}
    </main>
  );
}

function UpdateForm({ editToken }: { editToken: string }) {
  const [group, setGroup] = useState<'all' | RsvpStatus>('all');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  async function send() {
    setLoading(true);
    setResult('');
    const res = await fetch('/api/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ edit_token: editToken, subject, message, group }),
    });
    const data = await res.json();
    setLoading(false);
    setResult(res.ok ? `Sent to ${data.sent} guest(s).` : data.error);
  }

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="field-group">
        <label>Send to</label>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['all', 'yes', 'maybe', 'no'] as const).map((g) => (
            <button key={g} onClick={() => setGroup(g)} className={group === g ? 'btn-active' : ''} style={{ textTransform: 'capitalize' }}>
              {g}
            </button>
          ))}
        </div>
      </div>
      <div className="field-group">
        <label>Subject</label>
        <input placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
      </div>
      <div className="field-group">
        <label>Message</label>
        <textarea placeholder="Message" value={message} onChange={(e) => setMessage(e.target.value)} rows={5} />
      </div>
      <button onClick={send} disabled={loading} className="btn-primary">{loading ? 'Sending…' : 'Send'}</button>
      {result && <div className="muted">{result}</div>}
    </div>
  );
}

function ThankYouForm({ editToken, guests }: { editToken: string; guests: RsvpRecord[] }) {
  const [subject, setSubject] = useState('Thanks for coming!');
  const [baseMessage, setBaseMessage] = useState('It meant a lot to have you there.');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const emailable = guests.filter((g) => g.email);

  async function send() {
    setLoading(true);
    setResult('');
    const res = await fetch('/api/thankyou', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        edit_token: editToken,
        subject,
        base_message: baseMessage,
        notes: emailable.map((g) => ({ rsvp_id: g.id, note: notes[g.id] || '' })),
      }),
    });
    const data = await res.json();
    setLoading(false);
    setResult(res.ok ? `Sent to ${data.sent} guest(s).` : data.error);
  }

  if (emailable.length === 0) {
    return (
      <div className="card">
        <p className="muted" style={{ margin: 0 }}>No confirmed guests with an email yet.</p>
      </div>
    );
  }

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="field-group">
        <label>Subject</label>
        <input placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
      </div>
      <div className="field-group">
        <label>Shared message</label>
        <textarea placeholder="Goes to everyone" value={baseMessage} onChange={(e) => setBaseMessage(e.target.value)} rows={3} />
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: 10 }}>Personal note (optional, per guest)</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {emailable.map((g) => (
            <div key={g.id}>
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>{g.name}</div>
              <textarea
                placeholder="Optional"
                value={notes[g.id] || ''}
                onChange={(e) => setNotes({ ...notes, [g.id]: e.target.value })}
                rows={2}
              />
            </div>
          ))}
        </div>
      </div>

      <button onClick={send} disabled={loading} className="btn-primary">{loading ? 'Sending…' : `Send ${emailable.length} card(s)`}</button>
      {result && <div className="muted">{result}</div>}
    </div>
  );
}
