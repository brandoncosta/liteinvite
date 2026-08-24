// Minimal RFC4180-ish CSV parser — no dependency, runs client-side on the
// dashboard. Handles quoted fields, embedded commas, embedded newlines, and
// escaped quotes ("") so exports from Evite/Google Contacts/Excel/Numbers
// all parse fine without knowing their exact format ahead of time.
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  // Normalize line endings so \r\n doesn't leave stray \r characters.
  const s = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  for (let i = 0; i < s.length; i++) {
    const c = s[i];

    if (inQuotes) {
      if (c === '"') {
        if (s[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
      continue;
    }

    if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += c;
    }
  }
  // Last field/row (files don't always end with a trailing newline).
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((r) => r.some((cell) => cell.trim() !== ''));
}

const NAME_HEADERS = ['name', 'full name', 'fullname', 'guest name', 'guest'];
const FIRST_HEADERS = ['first name', 'firstname', 'first'];
const LAST_HEADERS = ['last name', 'lastname', 'last', 'surname'];
const EMAIL_HEADERS = ['email', 'e-mail', 'email address', 'guest email', 'e mail'];

function norm(h: string) {
  return h.trim().toLowerCase();
}

// Best-effort guess of which columns are name/first/last/email, so the
// import UI can pre-select sensible defaults — the host can always override
// via the dropdowns before confirming.
export function guessColumns(headers: string[]) {
  const normalized = headers.map(norm);
  const find = (candidates: string[]) => {
    const idx = normalized.findIndex((h) => candidates.includes(h));
    return idx === -1 ? null : idx;
  };
  return {
    name: find(NAME_HEADERS),
    first: find(FIRST_HEADERS),
    last: find(LAST_HEADERS),
    email: find(EMAIL_HEADERS),
  };
}
