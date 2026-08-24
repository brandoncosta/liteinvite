// Shared HTML email shell — cream/serif, matching InviteCard, so every
// email (dashboard link, guest updates, thank-yous) reads as one product
// instead of plain text. Every route still passes a `text` fallback too.

function siteUrl() {
  const url = process.env.NEXT_PUBLIC_SITE_URL;
  if (!url) {
    // Missing this env var is what causes emails to go out with relative
    // paths like "/dashboard/abc123" instead of a clickable link — warn
    // loudly in server logs rather than fail silently.
    console.warn(
      'NEXT_PUBLIC_SITE_URL is not set — links in outgoing emails will be relative and unclickable. ' +
      'Set it in .env.local (and in your host\'s env vars if deployed).'
    );
    return '';
  }
  return url.replace(/\/$/, '');
}

export function absoluteUrl(path: string): string {
  return `${siteUrl()}${path.startsWith('/') ? path : `/${path}`}`;
}

interface EmailButton {
  label: string;
  url: string;
}

// A single small button + optional secondary link, cream card shell.
// Keep this simple — most mail clients strip fancy CSS anyway.
export function renderEmailHtml(opts: {
  heading: string;
  bodyLines: string[]; // each rendered as its own paragraph
  primary?: EmailButton;
  secondary?: EmailButton;
  footer?: string;
}): string {
  const { heading, bodyLines, primary, secondary, footer } = opts;

  const paragraphs = bodyLines
    .map((line) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#2B2822;">${escapeHtml(line)}</p>`)
    .join('');

  const primaryHtml = primary
    ? `<a href="${primary.url}" style="display:inline-block;background:#0F6E56;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 22px;border-radius:6px;margin:6px 0 4px;">${escapeHtml(primary.label)}</a>`
    : '';

  const secondaryHtml = secondary
    ? `<p style="margin:14px 0 0;font-size:13px;color:#7A7568;">${escapeHtml(secondary.label)}<br/><a href="${secondary.url}" style="color:#0F6E56;word-break:break-all;">${secondary.url}</a></p>`
    : '';

  return `
<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#F3F1EA;font-family:Georgia,'Times New Roman',serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F3F1EA;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background:#FAF6EE;border:1px solid rgba(43,40,34,0.1);border-radius:4px;">
            <tr>
              <td style="padding:36px 32px;">
                <div style="width:36px;height:2px;background:#6E9B8A;margin:0 0 20px;"></div>
                <h1 style="margin:0 0 18px;font-family:Georgia,'Times New Roman',serif;font-weight:500;font-size:24px;color:#2B2822;letter-spacing:-0.01em;">${escapeHtml(heading)}</h1>
                ${paragraphs}
                ${primaryHtml ? `<div>${primaryHtml}</div>` : ''}
                ${secondaryHtml}
              </td>
            </tr>
          </table>
          ${footer ? `<p style="max-width:480px;margin:16px 0 0;font-size:12px;color:#9A9689;font-family:Helvetica,Arial,sans-serif;">${escapeHtml(footer)}</p>` : ''}
        </td>
      </tr>
    </table>
  </body>
</html>`.trim();
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
