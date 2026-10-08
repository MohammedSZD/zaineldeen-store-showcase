// Writes docs/photo-shot-list.csv: one row per product and collection that still needs a rights-cleared photograph.
//   npm run shotlist
import { writeFileSync, readFileSync } from 'node:fs';
import { products } from '../src/data/products.js';
import { compositions } from '../src/data/artwork.js';
import en from '../src/i18n/en.js';

const licensed = JSON.parse(readFileSync(new URL('../src/data/licensedImages.json', import.meta.url), 'utf8'));
const q = (s) => `"${String(s ?? '').replaceAll('"', '""')}"`;
const lines = [['id', 'brand', 'product', 'category', 'type', 'photos_to_supply', 'status', 'what_to_photograph'].join(',')];

for (const p of products) {
  const branded = Boolean(p.brand);
  const brief = branded
    ? 'The exact product as sold (same brand, name, size and shade): front view on a plain light background, soft even light, label readable, no people or other brands in frame. Add the retail box and a second angle if available.'
    : 'The product as sold: front view on a plain light background, soft even light, no readable third-party logos, no people. Add a second angle if available.';
  lines.push([p.id, p.brand ?? '', p.name, en[`cat.${p.category}`], p.sub ? en[`sub.${p.sub}`] : '', '1 to 3', licensed[p.id]?.length ? 'photo registered' : 'illustration (temporary)', brief].map(q).join(','));
}
const collectionBrief = {
  'collection-fragrance': 'Lifestyle photograph of perfume bottles on a neutral surface. Your own stock, or licensed stock with unbranded bottles.',
  'collection-makeup': 'Makeup flat lay with no readable logos, or your own stock arranged together.',
  'collection-sleepwear': 'Folded pyjamas or loungewear on a plain surface. Your own stock, or licensed unbranded stock.',
};
for (const id of Object.keys(compositions)) {
  lines.push([id, '', id.replace('collection-', 'Collection: '), 'Collection', '', '1', licensed[id]?.length ? 'photo registered' : 'illustration (temporary)', collectionBrief[id]].map(q).join(','));
}
writeFileSync(new URL('../docs/photo-shot-list.csv', import.meta.url), `${lines.join('\n')}\n`);
console.log(`Wrote ${lines.length - 1} rows to docs/photo-shot-list.csv`);
