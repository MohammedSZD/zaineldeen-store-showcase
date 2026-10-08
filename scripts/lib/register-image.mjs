// Shared by `npm run image:add` and `npm run image:batch`.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import sharp from 'sharp';
import { products } from '../../src/data/products.js';
import { compositions } from '../../src/data/artwork.js';
import { ALLOWED_LICENCES, validateEntry } from '../../src/lib/licensedImages.js';

const root = new URL('../../', import.meta.url);
const manifestUrl = new URL('src/data/licensedImages.json', root);
const knownIds = new Set([...products.map((p) => p.id), ...Object.keys(compositions)]);

/** Normalises a request into a manifest entry (without the file and id). */
export function toEntry(r) {
  return {
    n: Number(r.n ?? 1),
    platform: r.platform,
    author: r.author,
    sourceUrl: r.sourceUrl,
    licence: r.licence,
    licenceUrl: r.licenceUrl || ALLOWED_LICENCES[r.licence]?.url,
    retrieved: r.retrieved,
    fit: r.fit || 'cover',
    notes: r.notes || '',
  };
}

/** Returns a list of problems with a request (empty when it can be registered). */
export function check(r) {
  return [
    ...(knownIds.has(r.id) ? [] : [`unknown id "${r.id}" (use a product id or collection-fragrance, collection-makeup, collection-sleepwear)`]),
    ...(r.file && existsSync(r.file) ? [] : [`file not found: ${r.file}`]),
    ...validateEntry(toEntry(r)),
  ];
}

export async function register(r) {
  const entry = toEntry(r);
  const dir = new URL('assets/images/licensed/', root);
  mkdirSync(dir, { recursive: true });
  for (const w of [480, 960]) {
    const h = (w * 5) / 4;
    const pipeline = sharp(r.file).rotate();
    const out = entry.fit === 'contain' ? pipeline.resize(w, h, { fit: 'contain', background: '#ffffff' }) : pipeline.resize(w, h, { fit: 'cover', position: 'attention' });
    await out.webp({ quality: 80 }).toFile(new URL(`${r.id}-${entry.n}-${w}.webp`, dir).pathname);
  }
  const manifest = JSON.parse(readFileSync(manifestUrl, 'utf8'));
  manifest[r.id] = [...(manifest[r.id] ?? []).filter((e) => e.n !== entry.n), entry].sort((x, y) => x.n - y.n);
  writeFileSync(manifestUrl, `${JSON.stringify(manifest, null, 2)}\n`);
  return entry;
}
