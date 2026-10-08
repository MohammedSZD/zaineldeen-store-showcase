import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';

const dir = new URL('../../public/legacy/', import.meta.url).pathname;
const present = existsSync(dir);
const pages = present ? readdirSync(dir).filter((f) => f.endsWith('.html')) : [];
const read = (f) => readFileSync(join(dir, f), 'utf8');
// The only outside destinations a showcase page may link to.
const ALLOWED_OUTSIDE = [/^https:\/\/(www\.)?instagram\.com\//, /^https:\/\/(www\.)?facebook\.com\//, /^https:\/\/www\.google\.com\/maps\/dir\//];

test('legacy showcase is built', { skip: !present }, () => assert.ok(pages.length >= 25, `only ${pages.length} pages`));

test('every page is noindex, titled as an archive and carries the edition banner', { skip: !present }, () => {
  for (const f of pages) {
    const h = read(f);
    assert.match(h, /<meta name="robots" content="noindex">/, f);
    assert.match(h, /<title>[^<]*\(2020 archive\)<\/title>/, f);
    assert.match(h, /legacy-banner/, f);
    assert.match(h, /<html lang="en"/, f);
  }
});

test('no page references a local machine, an iframe, a form field for personal data or an outside script', { skip: !present }, () => {
  for (const f of pages) {
    const h = read(f);
    assert.ok(!/file:\/\//i.test(h), `${f}: file:// reference`);
    assert.ok(!/<iframe/i.test(h), `${f}: iframe`);
    assert.ok(!/type=["']?password/i.test(h), `${f}: password field`);
    assert.ok(!/mailto:|tel:/i.test(h), `${f}: contact link`);
    for (const m of h.matchAll(/<script[^>]*\ssrc=["']([^"']+)["']/gi)) assert.ok(!/^(https?:)?\/\//.test(m[1]), `${f}: outside script ${m[1]}`);
    for (const m of h.matchAll(/<link[^>]*\shref=["']([^"']+)["']/gi)) assert.ok(!/^(https?:)?\/\//.test(m[1]), `${f}: outside stylesheet ${m[1]}`);
  }
});

test('outside links are limited to the family social profiles and map directions', { skip: !present }, () => {
  for (const f of pages) {
    for (const m of read(f).matchAll(/(?:href|src)=["'](https?:\/\/[^"']+)["']/gi)) {
      assert.ok(ALLOWED_OUTSIDE.some((re) => re.test(m[1])), `${f}: ${m[1]}`);
    }
  }
});

test('every local link, image and asset resolves', { skip: !present }, () => {
  for (const f of pages) {
    for (const m of read(f).matchAll(/(?:href|src)=["']([^"'#?]+)(?:[?#][^"']*)?["']/gi)) {
      const target = m[1];
      if (/^(https?:|mailto:|data:|javascript:)/.test(target)) continue;
      // Links out of the showcase point at the modern edition, which is built into the same site root.
      if (target.startsWith('../')) {
        assert.ok(existsSync(join(dir, '..', '..', target.slice(3))) || existsSync(join(dir, '..', '..', 'public', target.slice(3))) || /^\.\.\/(index|then-and-now)\.html$/.test(target), `${f}: ${target}`);
        continue;
      }
      assert.ok(existsSync(join(dirname(join(dir, f)), target)), `${f}: missing ${target}`);
    }
  }
});

test('every image is an owned asset or a generated placeholder', { skip: !present }, () => {
  const img = readdirSync(join(dir, 'img'));
  for (const f of img) assert.ok(/^((slide-)?placeholder[\w-]*\.svg|heritage-\d\.webp|shopfront\.webp)$/.test(f), `unexpected image ${f}`);
});

test('pages carry the original 2020 identity: name, categories and a visible disclaimer', { skip: !present }, () => {
  const home = read('index.html');
  for (const w of ['Perfumes', 'Makeup', 'Underwear', 'Electrical', 'Biocosmetics']) assert.match(home, new RegExp(w), w);
  assert.match(home, /not current/);
  assert.match(home, /nothing can be ordered/);
});

test('retailer-template demo content is not republished', { skip: !present }, () => {
  for (const f of pages) {
    const h = read(f);
    for (const re of [/lorem ipsum/i, /G\.?M Garments/i, /bank offer/i, /cash on delivery/i, /scanfcode/i, /www\.(?!(instagram|facebook|google)\.com)[a-z0-9-]+\.(com|net)/i]) assert.ok(!re.test(h), `${f}: ${re}`);
  }
});

test('vendored libraries ship with their licences', { skip: !present }, () => {
  for (const f of readdirSync(join(dir, 'vendor/licenses'))) assert.ok(extname(f) === '.txt');
  assert.ok(readdirSync(join(dir, 'vendor/licenses')).length >= 3);
});
