'use client';

import { useState } from 'react';

// Small inline "code chip + copy button" used anywhere we show the host a
// link to hand off (guest invite link, dashboard link, etc). Falls back to
// a manual select if the Clipboard API is unavailable (e.g. non-HTTPS).
export default function CopyLink({ url, label }: { url: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard API blocked — select the text so the user can Cmd/Ctrl+C.
      const el = document.getElementById(`copy-link-${url}`);
      if (el) {
        const range = document.createRange();
        range.selectNodeContents(el);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      {label && <span className="muted">{label}</span>}
      <code id={`copy-link-${url}`} style={{ wordBreak: 'break-all' }}>{url}</code>
      <button type="button" onClick={copy} style={{ padding: '4px 10px', fontSize: 13 }}>
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  );
}
