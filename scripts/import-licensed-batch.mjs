// Registers many photographs at once from a CSV file. Every row is checked first; nothing is written if any row is invalid.
//
//   npm run image:batch -- path/to/photos.csv
//
// Columns (header required): file,id,n,platform,author,source_url,licence,licence_url,retrieved,fit,notes
// See docs/photo-intake-template.csv. `file` paths are relative to the CSV file.
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { check, register } from './lib/register-image.mjs';

const csvPath = process.argv[2];
if (!csvPath) {
  console.error('Usage: npm run image:batch -- path/to/photos.csv');
  process.exit(1);
}

/** Minimal CSV parser: quoted fields, doubled quotes, CRLF. */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') (cell += '"'), i++;
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') (row.push(cell), (cell = ''));
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell);
      cell = '';
      if (row.some((x) => x.trim() !== '')) rows.push(row);
      row = [];
    } else cell += c;
  }
  row.push(cell);
  if (row.some((x) => x.trim() !== '')) rows.push(row);
  return rows;
}

const [header, ...rows] = parseCsv(readFileSync(csvPath, 'utf8'));
const requests = rows.map((cells) => {
  const r = Object.fromEntries(header.map((h, i) => [h.trim(), (cells[i] ?? '').trim()]));
  return { file: resolve(dirname(csvPath), r.file), id: r.id, n: r.n || '1', platform: r.platform, author: r.author, sourceUrl: r.source_url, licence: r.licence, licenceUrl: r.licence_url, retrieved: r.retrieved, fit: r.fit, notes: r.notes };
});

const failures = requests.map((r, i) => ({ row: i + 2, problems: check(r) })).filter((x) => x.problems.length);
if (failures.length) {
  console.error('No images were registered. Fix these rows first:');
  for (const f of failures) console.error(`  row ${f.row}: ${f.problems.join('; ')}`);
  process.exit(1);
}
for (const r of requests) await register(r);
console.log(`Registered ${requests.length} photo(s). Now add them to the evidence log in docs/image-sources.md, then run npm test and npm run build.`);
