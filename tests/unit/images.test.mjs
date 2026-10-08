import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { products } from '../../src/data/products.js';
import { artwork, compositions } from '../../src/data/artwork.js';
import { ALLOWED_LICENCES, validateEntry } from '../../src/lib/licensedImages.js';

const root = new URL('../../', import.meta.url);
const manifest = JSON.parse(readFileSync(new URL('src/data/licensedImages.json', root), 'utf8'));
const knownIds = new Set([...products.map((p) => p.id), ...Object.keys(compositions)]);

test('every licensed photo is documented: known id, complete evidence, both files present', () => {
  for (const [id, entries] of Object.entries(manifest)) {
    assert.ok(knownIds.has(id), `unknown id ${id}`);
    entries.forEach((e, i) => {
      assert.deepEqual(validateEntry(e), [], `${id}[${i}]`);
      for (const w of [480, 960]) assert.ok(existsSync(new URL(`assets/images/licensed/${id}-${e.n}-${w}.webp`, root)), `${id}-${e.n}-${w}.webp`);
    });
  }
});

test('no file in assets/images/licensed lacks a manifest entry', () => {
  const dir = new URL('assets/images/licensed/', root);
  if (!existsSync(dir)) return;
  const registered = new Set(Object.entries(manifest).flatMap(([id, es]) => es.flatMap((e) => [480, 960].map((w) => `${id}-${e.n}-${w}.webp`))));
  for (const f of readdirSync(dir)) assert.ok(registered.has(f), `${f} is not registered in licensedImages.json`);
});

test('licence validation rejects incomplete or unknown evidence', () => {
  const good = { n: 1, platform: 'Unsplash', author: 'A. Person', sourceUrl: 'https://unsplash.com/photos/x', licence: 'unsplash', licenceUrl: ALLOWED_LICENCES.unsplash.url, retrieved: '2026-10-20', fit: 'cover' };
  assert.deepEqual(validateEntry(good), []);
  assert.ok(validateEntry({ ...good, sourceUrl: '' }).length);
  assert.ok(validateEntry({ ...good, author: '' }).length);
  assert.ok(validateEntry({ ...good, licence: 'found-online' }).length);
  assert.ok(validateEntry({ ...good, retrieved: 'yesterday' }).length);
  assert.ok(validateEntry({ ...good, fit: 'stretch' }).length);
});

test('quarantined third-party photos are outside every bundled folder', () => {
  const bundled = ['assets/images/branding', 'assets/images/heritage', 'assets/images/then-now', 'assets/images/illustrations', 'assets/images/licensed'];
  const quarantine = new URL('assets/unverified-third-party/', root);
  // The quarantine folder exists in the private archive only; the sanitized public repository omits it.
  for (const dir of bundled) {
    const path = new URL(`${dir}/`, root);
    if (!existsSync(path)) continue;
    const files = readdirSync(path, { recursive: true }).filter((f) => /\.(webp|jpe?g|png)$/.test(f));
    for (const f of files) assert.ok(/^(shopfront|logo-script|heritage-)/.test(f) || (dir.endsWith('then-now') && /^(legacy|modern)-/.test(f)) || dir.endsWith('licensed'), `${dir}/${f} is not an owned or licensed image`);
  }
  for (const d of readdirSync(new URL('assets/images/', root))) assert.ok(['branding', 'heritage', 'then-now', 'illustrations', 'licensed'].includes(d), `unexpected folder assets/images/${d}`);
});

test('production build ships only owned, original or licensed images', { skip: !existsSync(new URL('dist/assets/', root)) }, () => {
  const quarantineDir = new URL('assets/unverified-third-party/', root);
  const quarantined = new Set((existsSync(quarantineDir) ? readdirSync(quarantineDir, { recursive: true }) : []).filter((f) => f.endsWith('.webp')).map((f) => f.split('/').pop().replace(/\.webp$/, '')));
  const registered = new Set(Object.entries(manifest).flatMap(([id, es]) => es.flatMap((e) => [480, 960].map((w) => `${id}-${e.n}-${w}`))));
  const svgNames = new Set([...Object.keys(artwork), ...Object.keys(compositions)]);
  for (const f of readdirSync(new URL('dist/assets/', root)).filter((x) => /\.(webp|jpe?g|png|svg)$/.test(x))) {
    const base = f.replace(/-[\w-]{8}\.(webp|jpe?g|png|svg)$/, '');
    const ok = /^(shopfront|logo-script|heritage-|legacy-|modern-)/.test(f) || registered.has(base) || svgNames.has(base);
    assert.ok(ok, `unexpected image in build: ${f}`);
    assert.ok(!quarantined.has(base) || registered.has(base), `quarantined third-party image shipped: ${f}`);
  }
  for (const f of readdirSync(new URL('dist/', root)).filter((x) => /\.(webp|jpe?g|png)$/.test(x))) {
    assert.ok(['og-image.jpg', 'favicon-32.png', 'apple-touch-icon.png'].includes(f), `unexpected public image ${f}`);
  }
});

test('heritage banner: nine original pieces in order, files present, logo is piece 5', async () => {
  const { heritagePieces } = await import('../../src/data/heritage.js');
  assert.deepEqual(heritagePieces.map((p) => p.n), [1, 2, 3, 4, 5, 6, 7, 8, 9]);
  assert.deepEqual(heritagePieces.filter((p) => p.logo).map((p) => p.n), [5]);
  for (const p of heritagePieces) assert.ok(existsSync(new URL(`assets/images/heritage/heritage-${p.n}.webp`, root)), `heritage-${p.n}.webp`);
});

test('the photo shot list covers every product and collection', () => {
  const csv = readFileSync(new URL('docs/photo-shot-list.csv', root), 'utf8');
  for (const id of [...products.map((p) => p.id), ...Object.keys(compositions)]) assert.ok(csv.includes(`"${id}"`), `shot list is missing ${id} (run npm run shotlist)`);
});
