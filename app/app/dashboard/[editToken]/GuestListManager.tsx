'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GuestRecord } from '@/lib/supabase';
import { parseCsv, guessColumns } from '@/lib/csv';

type ColumnMap = { name: number | null; first: number | null; last: number | null; email: number | null };

// The invite list: import contacts (CSV, with a column-mapping step since
// every export — Evite, Google Contacts, a spreadsheet — uses different
// header names), add people one at a time, then actually send personalized
// invite emails. This is the piece that was missing before: previously
// there was no guest list at all, just one link the host had to share
// themselves.
export default function GuestListManager({ editToken, guests }: { editToken: string; guests: GuestRecord[] }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [csvRows, setCsvRows] = useState<string[][] | null>(null);
  const [columnMap, setColumnMap] = useState<ColumnMap>({ name: null, first: null, last: null, email: null });
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState('');

  const [manualName, setManualName] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [addingManual, setAddingManual] = useState(false);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState('');
  const [error, setError] = useState('');

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || '');
      const rows = parseCsv(text);
      if (rows.length < 1) {
        setError('That file looks empty.');
        return;
      }
      setCsvRows(rows);
      setColumnMap(guessColumns(rows[0]));
      setError('');
      setImportResult('');
    };
    reader.readAsText(file);
  }

  const previewRows = csvRows ? csvRows.slice(1, 6) : [];

  function fieldFor(row: string[]): { name: string; email: string } {
    const email = columnMap.email !== null ? (row[columnMap.email] || '').trim() : '';
    let name = columnMap.name !== null ? (row[columnMap.name] || '').trim() : '';
    if (!name && (columnMap.first !== null || columnMap.last !== null)) {
      const first = columnMap.first !== null ? row[columnMap.first] || '' : '';
      const last = columnMap.last !== null ? row[columnMap.last] || '' : '';
      name = `${first} ${last}`.trim();
    }
    return { name, email };
  }

  async function confirmImport() {
    if (!csvRows) return;
    if (columnMap.email === null || (columnMap.name === null && columnMap.first === null)) {
      setError('Pick at least an email column, and a name (or first name) column.');
      return;
    }
    const dataRows = csvRows.slice(1);
    const parsed = dataRows.map(fieldFor).filter((g) => g.name && g.email.includes('@'));

    if (parsed.length === 0) {
      setError('No rows had both a name and a valid email once mapped.');
      return;
    }

    setImporting(true);
    setError('');
    try {
      const res = await fetch('/api/guests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ edit_token: editToken, guests: parsed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Import failed.');
        return;
      }
      setImportResult(`Added ${data.added}${data.skipped ? `, skipped ${data.skipped} already on the list` : ''}.`);
      setCsvRows(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      router.refresh();
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
    } finally {
      setImporting(false);
    }
  }

  async function addManual(e: React.FormEvent) {
    e.preventDefault();
    if (!manualName.trim() || !manualEmail.trim()) return;
    setAddingManual(true);
    setError('');
    try {
      const res = await fetch('/api/guests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ edit_token: editToken, guests: [{ name: manualName, email: manualEmail }] }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not add guest.');
        return;
      }
      setManualName('');
      setManualEmail('');
      router.refresh();
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
    } finally {
      setAddingManual(false);
    }
  }

  async function removeGuest(id: string) {
    try {
      await fetch('/api/guests', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ edit_token: editToken, guest_id: id }),
      });
    } finally {
      router.refresh();
    }
  }

  function toggle(id: string) {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  }

  function selectNotInvited() {
    setSelected(new Set(guests.filter((g) => !g.invited_at).map((g) => g.id)));
  }

  async function sendInvites() {
    if (selected.size === 0) return;
    setSending(true);
    setSendResult('');
    try {
      const res = await fetch('/api/guests/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ edit_token: editToken, guest_ids: Array.from(selected) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSendResult(data.error || `Send failed (${res.status}).`);
        return;
      }
      const parts = [`Sent ${data.sent} invite(s)`];
      if (data.failed) parts.push(`${data.failed} failed${data.error ? ` — ${data.error}` : ''}`);
      setSendResult(parts.join(', ') + '.');
      setSelected(new Set());
      router.refresh();
    } catch {
      // Network error, or the server returned something that wasn't JSON
      // (a crashed route serving Next's HTML error page, etc) — without
      // this the button would just hang on "Sending…" forever.
      setSendResult('Could not reach the server. Check your connection and try again.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={{ display: 'block', marginBottom: 8 }}>Import contacts from a CSV</label>
          <p className="muted" style={{ marginTop: 0, marginBottom: 10 }}>
            Works with an export from Evite, Google/Apple Contacts, or any spreadsheet — you'll match up the
            columns on the next step.
          </p>
          <input ref={fileInputRef} type="file" accept=".csv,text/csv" onChange={handleFile} />
        </div>

        {csvRows && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="field-group">
                <label>Name column</label>
                <select
                  value={columnMap.name ?? ''}
                  onChange={(e) => setColumnMap({ ...columnMap, name: e.target.value === '' ? null : Number(e.target.value) })}
                >
                  <option value="">— none —</option>
                  {csvRows[0].map((h, i) => (
                    <option key={i} value={i}>{h || `Column ${i + 1}`}</option>
                  ))}
                </select>
              </div>
              <div className="field-group">
                <label>Email column</label>
                <select
                  value={columnMap.email ?? ''}
                  onChange={(e) => setColumnMap({ ...columnMap, email: e.target.value === '' ? null : Number(e.target.value) })}
                >
                  <option value="">— none —</option>
                  {csvRows[0].map((h, i) => (
                    <option key={i} value={i}>{h || `Column ${i + 1}`}</option>
                  ))}
                </select>
              </div>
              <div className="field-group">
                <label>First name column (if no combined name)</label>
                <select
                  value={columnMap.first ?? ''}
                  onChange={(e) => setColumnMap({ ...columnMap, first: e.target.value === '' ? null : Number(e.target.value) })}
                >
                  <option value="">— none —</option>
                  {csvRows[0].map((h, i) => (
                    <option key={i} value={i}>{h || `Column ${i + 1}`}</option>
                  ))}
                </select>
              </div>
              <div className="field-group">
                <label>Last name column (optional)</label>
                <select
                  value={columnMap.last ?? ''}
                  onChange={(e) => setColumnMap({ ...columnMap, last: e.target.value === '' ? null : Number(e.target.value) })}
                >
                  <option value="">— none —</option>
                  {csvRows[0].map((h, i) => (
                    <option key={i} value={i}>{h || `Column ${i + 1}`}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 6 }}>Preview</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {previewRows.map((row, i) => {
                  const f = fieldFor(row);
                  return (
                    <div key={i} className="muted" style={{ fontSize: 13 }}>
                      {f.name || '—'} · {f.email || '—'}
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={confirmImport} disabled={importing} className="btn-primary">
                {importing ? 'Importing…' : `Import ${csvRows.length - 1} row(s)`}
              </button>
              <button
                type="button"
                onClick={() => {
                  setCsvRows(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {importResult && <div className="muted">{importResult}</div>}

        <form onSubmit={addManual} style={{ display: 'flex', gap: 8, alignItems: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: 14 }}>
          <div className="field-group" style={{ flex: 1 }}>
            <label>Add one guest — name</label>
            <input value={manualName} onChange={(e) => setManualName(e.target.value)} placeholder="Full name" />
          </div>
          <div className="field-group" style={{ flex: 1 }}>
            <label>Email</label>
            <input value={manualEmail} onChange={(e) => setManualEmail(e.target.value)} placeholder="email@example.com" />
          </div>
          <button type="submit" disabled={addingManual}>{addingManual ? 'Adding…' : 'Add'}</button>
        </form>

        {error && <div className="error-text">{error}</div>}
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="tag">Invite list</span>
            <span className="muted">{guests.length}</span>
          </div>
          {guests.length > 0 && (
            <button type="button" onClick={selectNotInvited} style={{ fontSize: 13, padding: '4px 10px' }}>
              Select not-yet-invited
            </button>
          )}
        </div>

        {guests.length === 0 && <div className="muted">No guests added yet — import a CSV or add someone above.</div>}

        {guests.map((g) => (
          <div
            key={g.id}
            style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, padding: '10px 0', borderTop: '1px solid var(--border)' }}
          >
            <input type="checkbox" checked={selected.has(g.id)} onChange={() => toggle(g.id)} style={{ width: 'auto' }} />
            <div style={{ flex: 1 }}>
              <div>{g.name}</div>
              <div className="muted">{g.email}</div>
            </div>
            <span className="muted" style={{ fontSize: 12 }}>
              {g.rsvp_id ? 'RSVP’d' : g.invited_at ? 'Invited' : 'Not invited'}
            </span>
            <button type="button" onClick={() => removeGuest(g.id)} style={{ fontSize: 12, padding: '4px 8px' }}>
              Remove
            </button>
          </div>
        ))}

        {guests.length > 0 && (
          <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={sendInvites} disabled={sending || selected.size === 0} className="btn-primary">
              {sending ? 'Sending…' : `Send invite${selected.size !== 1 ? 's' : ''} (${selected.size})`}
            </button>
            {sendResult && <span className="muted">{sendResult}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
