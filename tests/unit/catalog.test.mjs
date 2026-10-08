import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { products } from '../../src/data/products.js';
import { categories } from '../../src/data/categories.js';
import { artwork, bareIds, compositions } from '../../src/data/artwork.js';
import { brands as brandTable } from '../../src/data/brands.js';
import { brandFacets, filterProducts, sortProducts, matchesQuery, relatedProducts, fold } from '../../src/lib/catalog.js';
import { setLang } from '../../src/i18n/index.js';

// The i18n module touches `document`/`location` only when switching language; stub just enough for Node.
globalThis.document = { documentElement: {}, querySelectorAll: () => [] };
globalThis.location = { href: 'http://localhost/', search: '' };
globalThis.history = { replaceState() {} };
globalThis.localStorage = { setItem() {}, getItem: () => null };

test('product ids are unique and reference valid categories and sub-categories', () => {
  assert.equal(new Set(products.map((p) => p.id)).size, products.length);
  for (const p of products) {
    const cat = categories.find((c) => c.id === p.category);
    assert.ok(cat, `${p.id}: unknown category ${p.category}`);
    if (p.sub) assert.ok(cat.subs.includes(p.sub), `${p.id}: unknown sub ${p.sub}`);
    assert.ok(p.price > 0 && p.summary && p.details.length, `${p.id}: incomplete data`);
  }
});

test('every product has an original illustration', () => {
  for (const p of products) {
    assert.ok(artwork[p.id], `${p.id}: no artwork spec`);
    assert.ok(existsSync(new URL(`../../assets/images/illustrations/${p.id}.svg`, import.meta.url)), `${p.id}.svg`);
  }
  for (const id of bareIds) assert.ok(existsSync(new URL(`../../assets/images/illustrations/bare/${id}.svg`, import.meta.url)), `bare/${id}.svg`);
  for (const name of Object.keys(compositions)) assert.ok(existsSync(new URL(`../../assets/images/illustrations/${name}.svg`, import.meta.url)), name);
});

test('English search matches names, brands and categories, ignoring case and accents', () => {
  assert.ok(filterProducts(products, { q: 'CHANEL' }).length >= 3);
  assert.ok(filterProducts(products, { q: 'pajama' }).length >= 5);
  assert.ok(filterProducts(products, { q: 'oreal' }).length >= 2); // accent-insensitive: "L'Oréal"
  assert.equal(filterProducts(products, { q: 'zzzz-no-match' }).length, 0);
  assert.ok(matchesQuery(products.find((p) => p.id === 'true-match-foundation'), "l'oreal paris foundation"));
});

test('Arabic search matches Arabic names, categories and spelling variants', () => {
  assert.ok(filterProducts(products, { q: 'بيجاما' }).length >= 5);
  assert.ok(filterProducts(products, { q: 'عطور' }).some((p) => p.category === 'perfumes'));
  assert.ok(filterProducts(products, { q: 'شانيل' }).length >= 1);
  // Alef variants and diacritics fold together; ta marbuta and ha fold together.
  assert.equal(fold('أحمر الشفاه'), fold('احمر الشفاة'));
  assert.ok(filterProducts(products, { q: 'احمر شفاه' }).length >= 3);
  assert.equal(filterProducts(products, { q: 'غير موجود تماما' }).length, 0);
});

test('English and Arabic searches reach the same product', () => {
  const en = filterProducts(products, { q: 'nightshirt' }).map((p) => p.id);
  const ar = filterProducts(products, { q: 'قميص نوم' }).map((p) => p.id);
  assert.ok(en.includes('love-nightshirt') && ar.includes('love-nightshirt'));
});

test('category, sub-category and saved filters combine', () => {
  const women = filterProducts(products, { cat: 'perfumes', sub: 'women' });
  assert.ok(women.length && women.every((p) => p.category === 'perfumes' && p.sub === 'women'));
  assert.equal(filterProducts(products, { cat: 'underwear' }).length, 0);
  const saved = filterProducts(products, { saved: true, wishlist: ['212-men', 'hair-dryer'] });
  assert.deepEqual(saved.map((p) => p.id).sort(), ['212-men', 'hair-dryer']);
});

test('sorting by price and name in both languages', () => {
  const asc = sortProducts(products, 'price-asc').map((p) => p.price);
  assert.deepEqual(asc, [...asc].sort((a, b) => a - b));
  const desc = sortProducts(products, 'price-desc').map((p) => p.price);
  assert.deepEqual(desc, [...desc].sort((a, b) => b - a));
  assert.ok(sortProducts(products, 'featured')[0].featured);
  const names = (lang) => {
    setLang(lang, { persist: false });
    return sortProducts(products, 'name-asc').map((p) => (lang === 'ar' ? p.ar.name : p.name));
  };
  const en = names('en');
  assert.deepEqual(en, [...en].sort((a, b) => a.localeCompare(b, 'en')));
  const ar = names('ar');
  assert.deepEqual(ar, [...ar].sort((a, b) => a.localeCompare(b, 'ar')));
  setLang('en', { persist: false });
});

test('related products stay in category and exclude the product itself', () => {
  const p = products.find((x) => x.id === 'one-million');
  const rel = relatedProducts(products, p);
  assert.ok(rel.length && rel.every((r) => r.category === 'perfumes' && r.id !== p.id));
  assert.equal(rel[0].sub, 'men');
});

test('every product brand is registered, and every registered brand has products', () => {
  for (const p of products) if (p.brand) assert.ok(brandTable[p.brand] && p.brandId === brandTable[p.brand].id, `${p.id}: ${p.brand}`);
  const used = new Set(products.map((p) => p.brandId));
  for (const [name, b] of Object.entries(brandTable)) assert.ok(used.has(b.id), `brand without products: ${name}`);
  assert.equal(new Set(Object.values(brandTable).map((b) => b.id)).size, Object.keys(brandTable).length, 'duplicate brand ids');
});

test('brand filter combines with category, sub-category, search and sorting', () => {
  const chanel = filterProducts(products, { brands: ['chanel'] });
  assert.ok(chanel.length >= 3 && chanel.every((p) => p.brand === 'Chanel'));
  const two = filterProducts(products, { brands: ['chanel', 'dolce-gabbana'] });
  assert.equal(two.length, chanel.length + filterProducts(products, { brands: ['dolce-gabbana'] }).length);
  const men = filterProducts(products, { cat: 'perfumes', sub: 'men', brands: ['chanel'] });
  assert.deepEqual(men.map((p) => p.id), ['bleu-de-chanel']);
  assert.deepEqual(filterProducts(products, { cat: 'makeup', brands: ['chanel'] }), []);
  assert.deepEqual(filterProducts(products, { brands: ['chanel'], q: 'coco' }).map((p) => p.id).sort(), ['coco-mademoiselle', 'coco-mademoiselle-intense']);
  const sorted = sortProducts(filterProducts(products, { brands: ['chanel', 'gucci'] }), 'price-asc').map((p) => p.price);
  assert.deepEqual(sorted, [...sorted].sort((a, b) => a - b));
});

test('brand facets are dynamic, accurate and ignore only the brand filter itself', () => {
  const all = brandFacets(products);
  assert.equal(all.reduce((n, f) => n + f.count, 0), products.filter((p) => p.brandId).length);
  assert.deepEqual(all.map((f) => f.name), [...all.map((f) => f.name)].sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' })));
  const perfumes = brandFacets(products, { cat: 'perfumes' });
  assert.ok(perfumes.some((f) => f.id === 'chanel') && !perfumes.some((f) => f.id === 'maybelline'));
  const makeup = brandFacets(products, { cat: 'makeup' });
  assert.ok(makeup.some((f) => f.id === 'maybelline') && makeup.some((f) => f.id === 'joko') && !makeup.some((f) => f.id === 'chanel'));
  assert.equal(brandFacets(products, { cat: 'underwear' }).length, 0);
  for (const f of perfumes) assert.equal(f.count, filterProducts(products, { cat: 'perfumes', brands: [f.id] }).length, f.name);
  // Selecting a brand must not hide the others: facets are computed without the brand filter.
  assert.deepEqual(brandFacets(products, { cat: 'perfumes', brands: ['chanel'] }), perfumes);
  const narrowed = brandFacets(products, { cat: 'perfumes', sub: 'men' });
  assert.ok(narrowed.length < perfumes.length && narrowed.every((f) => f.count === filterProducts(products, { cat: 'perfumes', sub: 'men', brands: [f.id] }).length));
  assert.deepEqual(brandFacets(products, { q: 'zzzz-no-match' }), []);
});

test('Arabic brand names find the brand\'s products', () => {
  const chanel = filterProducts(products, { q: 'شانيل' }).map((p) => p.brandId);
  assert.ok(chanel.length >= 4 && chanel.every((id) => id === 'chanel' || id !== undefined));
  assert.ok(filterProducts(products, { q: 'ميبيلين' }).some((p) => p.id === 'maybelline-superstay-matte-ink'));
  assert.ok(filterProducts(products, { q: 'غوتشي' }).every((p) => p.brandId === 'gucci') && filterProducts(products, { q: 'غوتشي' }).length >= 2);
});
