import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import en from '../../src/i18n/en.js';
import ar from '../../src/i18n/ar.js';
import { translate } from '../../src/i18n/index.js';
import { products } from '../../src/data/products.js';
import { categories } from '../../src/data/categories.js';

const placeholders = (v) => [...new Set([...JSON.stringify(v).matchAll(/\{(\w+)\}/g)].map((m) => m[1]))].sort().join(',');
const hasArabic = (s) => /[؀-ۿ]/.test(s);

test('English and Arabic dictionaries have identical keys', () => {
  assert.deepEqual(Object.keys(ar).sort(), Object.keys(en).sort());
});

test('no empty strings and matching {placeholders} in both languages', () => {
  for (const key of Object.keys(en)) {
    for (const dict of [en, ar]) assert.ok(JSON.stringify(dict[key]).length > 4, `empty value: ${key}`);
    assert.equal(placeholders(ar[key]), placeholders(en[key]), `placeholder mismatch: ${key}`);
  }
});

test('Arabic strings are actually Arabic (brand, URLs and sort keys excepted)', () => {
  const exempt = new Set(['brand.tag', 'lang.en', 'contact.osm']);
  for (const [key, value] of Object.entries(ar)) {
    if (exempt.has(key)) continue;
    const text = typeof value === 'object' ? Object.values(value).join(' ') : value;
    assert.ok(hasArabic(text), `not Arabic: ${key}`);
  }
});

test('Arabic plural forms cover every grammatical number', () => {
  const forms = (n) => translate('ar', 'shop.results', { count: n });
  assert.equal(forms(0), 'لا توجد منتجات');
  assert.equal(forms(1), 'منتج واحد');
  assert.equal(forms(2), 'منتجان');
  assert.equal(forms(5), '5 منتجات');
  assert.equal(forms(15), '15 منتجًا');
  assert.equal(forms(100), '100 منتج');
  assert.equal(translate('en', 'shop.results', { count: 1 }), '1 product');
  assert.equal(translate('en', 'shop.results', { count: 0 }), 'No products');
});

test('every category and sub-category has English and Arabic labels', () => {
  for (const c of categories) {
    for (const key of [`cat.${c.id}`, `cat.${c.id}.tag`, ...c.subs.map((s) => `sub.${s}`)]) {
      assert.ok(en[key] && ar[key], `missing label: ${key}`);
    }
  }
});

test('every product has complete Arabic copy matching the English structure', () => {
  for (const p of products) {
    assert.ok(p.ar, `${p.id}: no Arabic copy`);
    assert.ok(hasArabic(p.ar.name) && hasArabic(p.ar.summary), `${p.id}: Arabic name/summary`);
    assert.equal(p.ar.details.length, p.details.length, `${p.id}: detail count differs`);
    assert.ok(p.ar.details.every(hasArabic), `${p.id}: untranslated detail`);
  }
});

test('every data-i18n key used in the HTML exists in both dictionaries', () => {
  const files = ['index.html', 'shop.html', 'product.html', 'then-and-now.html', 'src/partials/header.html', 'src/partials/footer.html'];
  for (const f of files) {
    const html = readFileSync(new URL(`../../${f}`, import.meta.url), 'utf8');
    const keys = [...html.matchAll(/data-i18n="([\w.-]+)"/g)].map((m) => m[1]);
    for (const m of html.matchAll(/data-i18n-attr="([^"]+)"/g)) m[1].split(';').forEach((pair) => keys.push(pair.split(':')[1].trim()));
    for (const k of keys) assert.ok(en[k] && ar[k], `${f}: unknown key ${k}`);
  }
});

test('static fallback titles and descriptions match the English dictionary (what crawlers and link previews see)', () => {
  const decode = (s) => s.replace(/&amp;/g, '&');
  const pages = { 'index.html': ['meta.home.title', 'meta.home.desc'], 'shop.html': ['meta.shop.title', 'meta.shop.desc'], 'product.html': ['meta.product.title', 'meta.product.desc'] };
  for (const [file, [titleKey, descKey]] of Object.entries(pages)) {
    const html = readFileSync(new URL(`../../${file}`, import.meta.url), 'utf8');
    const title = decode(html.match(/<title>([^<]*)<\/title>/)[1]);
    const desc = decode(html.match(/<meta name="description" content="([^"]*)"/)[1]);
    const expectTitle = file === 'product.html' ? en[titleKey].replace('{name}', 'Product') : en[titleKey];
    assert.equal(title, expectTitle, `${file} title`);
    assert.equal(desc, en[descKey], `${file} description`);
    assert.equal(decode(html.match(/property="og:title" content="([^"]*)"/)[1]), expectTitle, `${file} og:title`);
    assert.equal(decode(html.match(/property="og:description" content="([^"]*)"/)[1]), en[descKey], `${file} og:description`);
  }
});
