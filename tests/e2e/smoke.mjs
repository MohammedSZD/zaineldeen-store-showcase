// End-to-end test of the production build in English and Arabic.
// Run `npm run build` first.
import { spawn, execSync, execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { existsSync, readFileSync, readdirSync, mkdtempSync, cpSync, symlinkSync, rmSync } from 'node:fs';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { products as catalog } from '../../src/data/products.js';

const PORT = 4179;
const BASE = `http://localhost:${PORT}`;
const fallback = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const repoRoot = new URL('../../', import.meta.url).pathname.replace(/\/$/, '');
const axePath = join(repoRoot, 'node_modules/axe-core/axe.min.js');
const results = [];
const check = async (name, fn) => {
  try {
    await fn();
    results.push(['PASS', name]);
  } catch (e) {
    results.push(['FAIL', `${name}: ${e.message.split('\n')[0]}`]);
  }
};

// Servers run in their own process group so the whole `npx` -> `vite` chain can be stopped cleanly.
const startServer = (args, options = {}) => spawn('npx', ['vite', 'preview', ...args, '--strictPort'], { stdio: 'ignore', detached: true, ...options });
const stopServer = (child) => {
  try {
    process.kill(-child.pid);
  } catch {
    /* already stopped */
  }
};
const servers = [startServer(['--port', String(PORT)])];
for (const port of [PORT]) {
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(`http://localhost:${port}`)).ok) break;
    } catch {
      await new Promise((r) => setTimeout(r, 200));
    }
  }
}

const browser = await chromium.launch(existsSync(fallback) ? { executablePath: fallback } : {});
const problems = [];
const external = new Set();

async function openPage(lang, width = 1440) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 } });
  if (lang) await ctx.addInitScript((l) => localStorage.setItem('zaineldeen:lang', l), lang);
  const page = await ctx.newPage();
  page.on('console', (m) => ['error', 'warning'].includes(m.type()) && problems.push(`${m.type()}: ${m.text()}`));
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
  // Requests the browser aborts when a test navigates away or closes the page are expected; real failures are not.
  page.on('requestfailed', (r) => r.failure()?.errorText !== 'net::ERR_ABORTED' && problems.push(`requestfailed: ${r.url()} (${r.failure()?.errorText})`));
  page.on('response', (r) => r.status() >= 400 && problems.push(`${r.status()}: ${r.url()}`));
  page.on('request', (r) => !/^(http:\/\/localhost|data:|blob:)/.test(r.url()) && external.add(r.url()));
  return page;
}

const brokenImages = (page) => page.evaluate(() => [...document.images].filter((i) => i.complete && !i.naturalWidth).map((i) => i.src));
async function load(page, url, base = BASE) {
  await page.goto(`${base}/${url}`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.querySelectorAll('img[loading=lazy]').forEach((i) => (i.loading = 'eager')));
  await page.evaluate(() => Promise.all([...document.images].map((i) => (i.complete ? 1 : new Promise((r) => (i.onload = i.onerror = r))))));
}
const prices = async (page) => (await page.locator('#product-grid .card__price').allTextContents()).map((t) => Number(t.match(/\$(\d+)/)[1]));

const COPY = {
  en: { dir: 'ltr', h1: /Fragrance, beauty/, search: 'chanel', empty: /coming soon/i, ask: /Ask on Instagram/, saved: /Saved/ },
  ar: { dir: 'rtl', h1: /عطور وجمال/, search: 'شانيل', empty: /قريبًا/, ask: /اسأل عبر إنستغرام/, saved: /تمت الإضافة/ },
};

for (const lang of ['en', 'ar']) {
  const c = COPY[lang];
  const page = await openPage(lang);

  await check(`[${lang}] home: lang/dir attributes, hero, 6 categories, 8 featured, no broken images`, async () => {
    await load(page, 'index.html');
    assert.equal(await page.getAttribute('html', 'lang'), lang);
    assert.equal(await page.getAttribute('html', 'dir'), c.dir);
    assert.match(await page.textContent('h1'), c.h1);
    assert.equal(await page.locator('#category-grid li').count(), 6);
    assert.equal(await page.locator('#featured-grid .card').count(), 8);
    assert.deepEqual(await brokenImages(page), []);
  });

  await check(`[${lang}] home: internal links and anchors resolve`, async () => {
    const hrefs = await page.$$eval('a[href]', (as) => as.map((a) => a.getAttribute('href')));
    for (const h of new Set(hrefs)) {
      if (/^https?:/.test(h)) continue;
      assert.ok(!/^(tel|mailto):/.test(h), `unexpected contact link ${h}`);
      if (h.startsWith('#')) {
        if (h !== '#') assert.ok(await page.locator(h).count(), `missing anchor ${h}`);
        continue;
      }
      const [path, hash] = h.split('#');
      assert.ok((await fetch(`${BASE}/${path.split('?')[0]}`)).ok, `broken link ${h}`);
      if (hash && path.startsWith('index.html')) assert.ok(await page.locator(`#${hash}`).count(), `missing #${hash}`);
    }
  });

  await check(`[${lang}] contact: business location links and official social links`, async () => {
    await page.goto(`${BASE}/index.html#contact`, { waitUntil: 'networkidle' });
    const dir = await page.getAttribute('#map-directions', 'href');
    assert.match(dir, /^https:\/\/www\.google\.com\/maps\/dir\/\?api=1&destination=31\.5307\d*,34\.4644\d*$/);
    assert.match(await page.getAttribute('#map-osm', 'href'), /^https:\/\/www\.openstreetmap\.org\/\?mlat=31\.5307\d*&mlon=34\.4644\d*#map=17\//);
    assert.match(await page.textContent('#location-coords'), /31\.5307° N, 34\.4644° E/);
    assert.equal(await page.getAttribute('#location-coords bdi', 'dir'), 'ltr');
    assert.match(await page.textContent('.location__place'), lang === 'ar' ? /الرمال، غزة/ : /Al-Remal, Gaza/);
    const social = await page.$$eval('a[href*="instagram.com"], a[href*="facebook.com"]', (as) => [...new Set(as.map((a) => a.href))]);
    assert.deepEqual(social.sort(), ['https://www.facebook.com/Zaineldeenstores/', 'https://www.instagram.com/zaineldeenstores/']);
    assert.equal(await page.locator('iframe').count(), 0, 'no third-party embeds');
  });

  await check(`[${lang}] rendered pages expose no phone numbers, e-mail addresses or passwords`, async () => {
    for (const u of ['index.html', 'shop.html', 'product.html?id=one-million']) {
      await load(page, u);
      const html = await page.content();
      assert.ok(!/[\w.+-]+@[\w-]+\.[a-z]{2,}/i.test(html), `${u}: e-mail`);
      assert.ok(!/(?<![\d.])(?:\+|00)\s?97\d[\s-]?\d[\d\s-]{6,}\d/.test(html), `${u}: phone`);
      assert.ok(!/type=["']password/i.test(html), `${u}: password field`);
    }
  });

  await check(`[${lang}] shop: full catalog, no broken images, empty state hidden`, async () => {
    await load(page, 'shop.html');
    assert.ok((await page.locator('#product-grid .card').count()) >= 30);
    assert.ok(!(await page.locator('#empty').isVisible()));
    assert.deepEqual(await brokenImages(page), []);
  });

  await check(`[${lang}] shop: search in this language filters, updates URL, shows empty state`, async () => {
    await page.fill('#shop-q', c.search);
    await page.waitForTimeout(300);
    const n = await page.locator('#product-grid .card').count();
    assert.ok(n >= 1 && n < 10, `got ${n}`);
    assert.match(decodeURIComponent(page.url()), new RegExp(`q=${c.search}`));
    await page.fill('#shop-q', 'qqqqq');
    await page.waitForTimeout(300);
    assert.ok(await page.locator('#empty').isVisible());
    await page.click('#reset');
    assert.ok((await page.locator('#product-grid .card').count()) >= 30);
  });

  await check(`[${lang}] shop: search crosses languages (English and Arabic find the same item)`, async () => {
    for (const q of ['nightshirt', 'قميص نوم']) {
      await page.fill('#shop-q', q);
      await page.waitForTimeout(300);
      assert.equal(await page.locator('#product-grid .card[data-id="love-nightshirt"]').count(), 1, q);
    }
    await page.fill('#shop-q', '');
    await page.waitForTimeout(300);
  });

  await check(`[${lang}] shop: category + sub-category chips and "coming soon" empty state`, async () => {
    await page.click('#cat-chips [data-cat="perfumes"]');
    await page.click('#sub-chips [data-sub="men"]');
    assert.ok((await page.locator('#product-grid .card').count()) >= 5);
    assert.match(page.url(), /cat=perfumes&sub=men/);
    await page.click('#cat-chips [data-cat="underwear"]');
    assert.match(await page.textContent('#empty-title'), c.empty);
    await page.click('#cat-chips [data-cat=""]');
  });

  await check(`[${lang}] shop: sorting by price both ways`, async () => {
    await page.selectOption('#shop-sort', 'price-asc');
    const asc = await prices(page);
    assert.deepEqual(asc, [...asc].sort((a, b) => a - b));
    await page.selectOption('#shop-sort', 'price-desc');
    const desc = await prices(page);
    assert.deepEqual(desc, [...desc].sort((a, b) => b - a));
  });

  await check(`[${lang}] heritage banner: nine original pieces in original order, sharp, inside the viewport`, async () => {
    await load(page, 'index.html');
    const srcs = await page.$$eval('.heritage__piece', (els) => els.map((e) => e.getAttribute('src').match(/heritage-(\d)/)[1]));
    assert.deepEqual(srcs, ['1', '2', '3', '4', '5', '6', '7', '8', '9']);
    assert.match(await page.getAttribute('.heritage__logo', 'alt'), lang === 'ar' ? /زين الدين/ : /Zain El Deen/);
    assert.deepEqual(await brokenImages(page), []);
    const box = await page.locator('.heritage__row').boundingBox();
    assert.ok(box.x >= 0 && box.x + box.width <= 1440);
    // The artwork keeps its original left-to-right order even in the right-to-left layout.
    const first = await page.locator('.heritage__piece').first().boundingBox();
    const logo = await page.locator('.heritage__logo').boundingBox();
    assert.ok(first.x < logo.x, 'icon 1 stays left of the logo');
    const sharp = await page.$$eval('.heritage__piece', (els) => els.every((e) => e.naturalHeight >= e.getBoundingClientRect().height));
    assert.ok(sharp, 'no piece is upscaled');
  });

  await check(`[${lang}] brand filter: dynamic brands, combines with category, search and sorting, URL and clearing`, async () => {
    await load(page, 'shop.html?cat=perfumes');
    const perfumesTotal = await page.locator('#product-grid .card').count();
    assert.equal(await page.getAttribute('#brand-toggle', 'aria-expanded'), 'false');
    await page.click('#brand-toggle');
    assert.equal(await page.getAttribute('#brand-toggle', 'aria-expanded'), 'true');
    const names = await page.$$eval('#brand-list .brand-opt__name', (els) => els.map((e) => e.textContent.trim()));
    assert.ok(names.includes('Chanel') && names.includes('Dolce & Gabbana') && !names.includes('Maybelline'), `brands in perfumes: ${names}`);
    const countOf = async (id) => Number(await page.textContent(`#brand-list input[value="${id}"] ~ .brand-opt__count`));
    const chanelCount = await countOf('chanel');
    await page.check('#brand-list input[value="chanel"]');
    assert.equal(await page.locator('#product-grid .card').count(), chanelCount);
    assert.match(page.url(), /brand=chanel/);
    assert.match((await page.textContent('#brand-count')).trim(), /^1\b/);
    assert.equal(await page.locator('#brand-pills .pill').count(), 1);
    // other brands remain selectable and add up
    const dgCount = await countOf('dolce-gabbana');
    await page.check('#brand-list input[value="dolce-gabbana"]');
    assert.equal(await page.locator('#product-grid .card').count(), chanelCount + dgCount);
    // combines with sub-category, search and sorting
    await page.click('#sub-chips [data-sub="men"]');
    assert.deepEqual(await page.$$eval('#product-grid .card', (c) => c.map((x) => x.dataset.id)), ['bleu-de-chanel']);
    await page.click('#sub-chips [data-sub=""]');
    await page.fill('#shop-q', lang === 'ar' ? 'كوكو' : 'coco');
    await page.waitForTimeout(300);
    assert.equal(await page.locator('#product-grid .card').count(), 2);
    await page.fill('#shop-q', '');
    await page.waitForTimeout(300);
    await page.selectOption('#shop-sort', 'price-asc');
    const asc = await prices(page);
    assert.deepEqual(asc, [...asc].sort((a, b) => a - b));
    // shareable URL survives a reload
    await page.reload({ waitUntil: 'networkidle' });
    assert.match(page.url(), /brand=chanel(%2C|,)dolce-gabbana/);
    assert.equal(await page.locator('#brand-pills .pill').count(), 2);
    assert.equal(await page.locator('#product-grid .card').count(), chanelCount + dgCount);
    // remove one brand with its pill, then clear all
    await page.click('#brand-pills .pill >> nth=0');
    assert.equal(await page.locator('#brand-pills .pill').count(), 1);
    await page.click('#brand-clear');
    assert.equal(await page.locator('#brand-pills .pill').count(), 0);
    assert.ok(!/brand=/.test(page.url()));
    assert.equal(await page.locator('#product-grid .card').count(), perfumesTotal);
  });

  await check(`[${lang}] brand filter: switching category prunes brands that no longer apply; empty state; Escape closes`, async () => {
    await load(page, 'shop.html?cat=perfumes&brand=chanel');
    assert.equal(await page.locator('#brand-pills .pill').count(), 1);
    await page.click('#cat-chips [data-cat="makeup"]');
    assert.equal(await page.locator('#brand-pills .pill').count(), 0, 'Chanel does not exist in makeup');
    const makeup = await page.$$eval('#brand-list .brand-opt__name', (els) => els.map((e) => e.textContent.trim()));
    assert.ok(makeup.includes('Maybelline') && makeup.includes('JOKO') && makeup.includes('Eveline') && !makeup.includes('Chanel'));
    await page.click('#cat-chips [data-cat="underwear"]');
    assert.ok(await page.locator('#brandbar').isHidden(), 'no brand bar where no brand exists');
    await page.click('#cat-chips [data-cat=""]');
    await page.click('#brand-toggle');
    await page.check('#brand-list input[value="chanel"]');
    await page.fill('#shop-q', 'qqqq');
    await page.waitForTimeout(300);
    assert.ok(await page.locator('#empty').isVisible());
    assert.match(await page.textContent('#empty-text'), lang === 'ar' ? /العلامات المحددة/ : /selected brands/);
    await page.click('#reset');
    assert.equal(await page.locator('#brand-pills .pill').count(), 0);
    await page.click('#brand-toggle');
    await page.press('#brand-list input >> nth=0', 'Escape');
    assert.equal(await page.getAttribute('#brand-toggle', 'aria-expanded'), 'false');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'brand-toggle');
  });

  await check(`[${lang}] brand filter: labels are translated and the layout follows the language direction`, async () => {
    await load(page, 'shop.html?cat=perfumes&brand=chanel');
    await page.click('#brand-toggle');
    assert.match(await page.textContent('#brand-toggle'), lang === 'ar' ? /العلامة التجارية/ : /Brand/);
    assert.match(await page.textContent('#brand-clear'), lang === 'ar' ? /مسح العلامات/ : /Clear brands/);
    const dir = await page.evaluate(() => getComputedStyle(document.querySelector('#brand-panel')).direction);
    assert.equal(dir, lang === 'ar' ? 'rtl' : 'ltr');
    const [toggle, pill] = await Promise.all([page.locator('#brand-toggle').boundingBox(), page.locator('#brand-pills .pill').first().boundingBox()]);
    assert.ok(lang === 'ar' ? pill.x < toggle.x : pill.x > toggle.x, 'pills follow the toggle in reading order');
    const count = await page.locator('#brand-list .brand-opt__count').first().boundingBox();
    const name = await page.locator('#brand-list .brand-opt__name').first().boundingBox();
    assert.ok(lang === 'ar' ? count.x < name.x : count.x > name.x, 'counts sit at the end of each option');
  });

  await check(`[${lang}] wishlist: persists across reloads and drives the saved view`, async () => {
    await page.goto(`${BASE}/shop.html`, { waitUntil: 'networkidle' });
    await page.locator('.card [data-wish]').nth(0).click();
    await page.locator('.card [data-wish]').nth(2).click();
    assert.equal(await page.locator('[data-wish-count]').first().textContent(), '2');
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await page.locator('.card .wish.is-saved').count(), 2);
    await page.goto(`${BASE}/shop.html?saved=1`, { waitUntil: 'networkidle' });
    assert.equal(await page.locator('#product-grid .card').count(), 2);
    await page.locator('.card [data-wish]').first().click();
    assert.equal(await page.locator('#product-grid .card').count(), 1);
    await page.evaluate(() => localStorage.removeItem('zaineldeen:wishlist:v1'));
  });

  await check(`[${lang}] product: details, illustration note, wishlist button, title, related items`, async () => {
    await load(page, 'product.html?id=gucci-premiere');
    assert.match(await page.textContent('.gallery__note'), lang === 'ar' ? /رسم توضيحي/ : /Illustration/);
    assert.match(await page.getAttribute('#gallery-main', 'alt'), lang === 'ar' ? /^رسم توضيحي لـ/ : /^Illustration for/);
    await page.click('.wish-btn');
    assert.equal(await page.getAttribute('.wish-btn', 'aria-pressed'), 'true');
    assert.match(await page.textContent('.wish-btn'), c.saved);
    assert.match(await page.title(), lang === 'ar' ? /زين الدين/ : /Zain El Deen Store/);
    assert.match(await page.textContent('.detail__info'), c.ask);
    assert.ok((await page.locator('#related-grid .card').count()) >= 1);
    assert.deepEqual(await brokenImages(page), []);
    await page.evaluate(() => localStorage.removeItem('zaineldeen:wishlist:v1'));
  });

  await check(`[${lang}] product: unknown id shows a helpful not-found state`, async () => {
    await page.goto(`${BASE}/product.html?id=nope`, { waitUntil: 'networkidle' });
    assert.ok((await page.textContent('#product-root')).length > 40);
    assert.ok(await page.locator('#product-root a[href="shop.html"]').count());
  });

  await check(`[${lang}] keyboard: skip link is the first tab stop; chips are operable`, async () => {
    await page.goto(`${BASE}/shop.html`, { waitUntil: 'networkidle' });
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement.className), 'skip-link');
    await page.locator('#cat-chips [data-cat="makeup"]').focus();
    await page.keyboard.press('Enter');
    assert.equal(await page.getAttribute('#cat-chips [data-cat="makeup"]', 'aria-pressed'), 'true');
  });

  await page.context().close();
}

// ── Language switching ────────────────────────────────────────────────
{
  const page = await openPage(null);
  await check('language: defaults to English (LTR) with no stored preference', async () => {
    await load(page, 'index.html');
    assert.equal(await page.getAttribute('html', 'lang'), 'en');
    assert.equal(await page.getAttribute('html', 'dir'), 'ltr');
  });
  await check('language: switching to Arabic flips lang/dir, translates the page and is remembered', async () => {
    await page.click('.lang-switch--header [data-lang="ar"]');
    assert.equal(await page.getAttribute('html', 'dir'), 'rtl');
    assert.equal(await page.getAttribute('html', 'lang'), 'ar');
    assert.match(await page.textContent('h1'), /عطور وجمال/);
    assert.equal(await page.getAttribute('.lang-switch--header [data-lang="ar"]', 'aria-pressed'), 'true');
    assert.match(await page.title(), /متجر زين الدين/);
    assert.equal(await page.evaluate(() => localStorage.getItem('zaineldeen:lang')), 'ar');
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await page.getAttribute('html', 'dir'), 'rtl');
    await page.goto(`${BASE}/shop.html`, { waitUntil: 'networkidle' });
    assert.equal(await page.getAttribute('html', 'lang'), 'ar');
  });
  await check('language: switching on the shop keeps filters and re-renders cards, chips and sorting', async () => {
    const perfumes = catalog.filter((p) => p.category === 'perfumes').length;
    await page.goto(`${BASE}/shop.html?cat=perfumes&sort=price-asc&lang=en`, { waitUntil: 'networkidle' });
    assert.equal(await page.getAttribute('html', 'lang'), 'en');
    await page.click('.lang-switch--header [data-lang="ar"]');
    assert.match(page.url(), /lang=ar/);
    assert.match(await page.textContent('#shop-title'), /العطور/);
    assert.equal(await page.inputValue('#shop-sort'), 'price-asc');
    assert.match(await page.textContent('#results'), new RegExp(`${perfumes} منتج`));
    assert.match(await page.textContent('.card__title'), /[؀-ۿ]/);
    await page.click('.lang-switch--header [data-lang="en"]');
    assert.match(await page.textContent('#results'), new RegExp(`${perfumes} products`));
  });
  await check('language: switching on a product page re-renders it in Arabic', async () => {
    await page.goto(`${BASE}/product.html?id=gucci-premiere`, { waitUntil: 'networkidle' });
    await page.click('.lang-switch--header [data-lang="ar"]');
    assert.match(await page.textContent('h1'), /بريمير/);
    assert.match(await page.getAttribute('#gallery-main', 'alt'), /رسم توضيحي/);
    assert.equal(await page.getAttribute('html', 'dir'), 'rtl');
  });
  await check('language: ?lang=ar in the URL overrides the stored preference', async () => {
    await page.evaluate(() => localStorage.setItem('zaineldeen:lang', 'en'));
    await page.goto(`${BASE}/index.html?lang=ar`, { waitUntil: 'networkidle' });
    assert.equal(await page.getAttribute('html', 'dir'), 'rtl');
  });
  await page.context().close();
}

// ── Responsive layout, both languages ─────────────────────────────────
for (const lang of ['en', 'ar']) {
  for (const w of [320, 375, 430, 768, 1024, 1440, 1920]) {
    await check(`[${lang}] layout ${w}px: no horizontal overflow, nothing clipped in the header`, async () => {
      const page = await openPage(lang, w);
      for (const u of ['index.html', 'shop.html', 'product.html?id=zip-lounge-set']) {
        await load(page, u);
        const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        assert.ok(over <= 0, `${u} overflows by ${over}px`);
        // Every visible header child (hidden ones have zero width) must sit inside the viewport.
        const headerRight = await page.evaluate(() =>
          [...document.querySelectorAll('.site-header__inner > *')].every((el) => {
            const b = el.getBoundingClientRect();
            return b.width === 0 || (b.left >= -0.5 && b.right <= innerWidth + 0.5);
          }),
        );
        assert.ok(headerRight, `${u}: header content leaves the viewport`);
      }
      await page.context().close();
    });
  }
}

// ── Brand filter on small screens ─────────────────────────────────────
for (const lang of ['en', 'ar']) {
  for (const width of [320, 390]) {
    await check(`[${lang}] brand filter at ${width}px: panel usable, touch targets, no overflow`, async () => {
      const page = await openPage(lang, width);
      await load(page, 'shop.html?cat=makeup');
      await page.click('#brand-toggle');
      const panel = await page.locator('#brand-panel').boundingBox();
      assert.ok(panel.x >= 0 && panel.x + panel.width <= width, 'panel inside the viewport');
      const heights = await page.$$eval('#brand-list .brand-opt', (els) => els.map((e) => e.getBoundingClientRect().height));
      assert.ok(heights.every((h) => h >= 44), 'every option is at least 44px tall');
      await page.check('#brand-list input[value="maybelline"]');
      await page.check('#brand-list input[value="joko"]');
      await page.check('#brand-list input[value="eveline"]');
      assert.equal(await page.locator('#brand-pills .pill').count(), 3);
      assert.ok((await page.locator('#product-grid .card').count()) >= 5);
      const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      assert.ok(over <= 0, `overflows by ${over}px`);
      await page.click('#brand-clear');
      assert.equal(await page.locator('#brand-pills .pill').count(), 0);
      await page.context().close();
    });
  }
}

// ── Mobile menu ───────────────────────────────────────────────────────
for (const [lang, width] of [['en', 390], ['ar', 390], ['ar', 320]]) {
  await check(`[${lang}] mobile menu at ${width}px: opens, switches language, Escape closes, navigates`, async () => {
    const page = await openPage(lang, width);
    await page.goto(`${BASE}/index.html`, { waitUntil: 'networkidle' });
    assert.ok(!(await page.locator('#site-nav').isVisible()));
    await page.click('#menu-toggle');
    assert.ok(await page.locator('#site-nav').isVisible());
    assert.equal(await page.getAttribute('#menu-toggle', 'aria-expanded'), 'true');
    if (width < 480) {
      assert.ok(await page.locator('.lang-switch--menu').isVisible(), 'language switch available in the menu');
      const other = lang === 'en' ? 'ar' : 'en';
      await page.click(`.lang-switch--menu [data-lang="${other}"]`);
      assert.equal(await page.getAttribute('html', 'lang'), other);
      await page.click(`.lang-switch--menu [data-lang="${lang}"]`);
    }
    await page.keyboard.press('Escape');
    assert.ok(!(await page.locator('#site-nav').isVisible()));
    await page.click('#menu-toggle');
    await page.click('#site-nav a[href="shop.html"]');
    await page.waitForURL(/shop\.html/);
    await page.context().close();
  });
}

// ── Licensed-photo pipeline, tested on a throw-away copy of the project ─
// The real repository registers no licensed photos, so the gallery, credit line and bundling rules are
// exercised with synthetic images added through the real CLI in a temporary copy.
const FIXTURE_PORT = 4181;
const FIXTURE_BASE = `http://localhost:${FIXTURE_PORT}`;
const fixtureDir = mkdtempSync(join(tmpdir(), 'zd-fixture-'));
let fixtureServer;
try {
  cpSync(repoRoot, fixtureDir, { recursive: true, filter: (src) => !/[\\/](node_modules|\.git|dist|unverified-third-party|screenshots)([\\/]|$)/.test(src) });
  symlinkSync(join(repoRoot, 'node_modules'), join(fixtureDir, 'node_modules'));
  const sharp = (await import('sharp')).default;
  const register = (id, n, fit) => execFileSync('node', ['scripts/add-licensed-image.mjs', '--file', join(fixtureDir, `fx-${id}-${n}.jpg`), '--id', id, '--n', String(n), '--platform', 'Fixture', '--author', 'E2E Fixture', '--source-url', `https://example.com/fixture/${id}/${n}`, '--licence', 'owned', '--retrieved', '2026-01-01', '--fit', fit], { cwd: fixtureDir });
  for (const [id, count, fit] of [['the-only-one', 3, 'contain'], ['zip-lounge-set', 2, 'cover'], ['collection-makeup', 1, 'cover']]) {
    for (let n = 1; n <= count; n++) {
      await sharp({ create: { width: 1000, height: 1250, channels: 3, background: '#b9a', noise: { type: 'gaussian', mean: 128, sigma: 40 } } }).jpeg().toFile(join(fixtureDir, `fx-${id}-${n}.jpg`));
      register(id, n, fit);
    }
  }
  execSync('npx vite build', { cwd: fixtureDir, stdio: 'ignore' });
  fixtureServer = startServer(['--port', String(FIXTURE_PORT)], { cwd: fixtureDir });
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(FIXTURE_BASE)).ok) break;
    } catch {
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  await check('licensed pipeline: registered photos are bundled; unregistered ones are not', async () => {
    const files = readdirSync(join(fixtureDir, 'dist/assets'));
    assert.ok(files.some((f) => /^the-only-one-1-960-/.test(f)) && files.some((f) => /^zip-lounge-set-2-480-/.test(f)) && files.some((f) => /^collection-makeup-1-960-/.test(f)));
    assert.ok(!files.some((f) => /^(gucci-premiere|jpg-ultra-male|ch-men-prive)-\d-\d+-/.test(f)), 'unregistered photo bundled');
  });

  for (const lang of ['en', 'ar']) {
    const c = COPY[lang];
    const page = await openPage(lang);
    await check(`[${lang}] gallery: buttons, thumbnails, arrow keys, credit line, wishlist (licensed fixture)`, async () => {
      await load(page, 'product.html?id=the-only-one', FIXTURE_BASE);
      assert.equal(await page.locator('.thumb').count(), 3);
      assert.match(await page.getAttribute('#gallery-main', 'src'), /the-only-one-1-960/);
      assert.match(await page.textContent('#gallery-note'), lang === 'ar' ? /الصورة: E2E Fixture على/ : /Photo: E2E Fixture on/);
      assert.equal(await page.getAttribute('#gallery-note a', 'href'), 'https://example.com/fixture/the-only-one/1');
      await page.click('.gallery__nav--next');
      assert.match(await page.getAttribute('#gallery-main', 'src'), /the-only-one-2-960/);
      await page.locator('.thumb').nth(0).focus();
      // Arrow keys follow the visual direction: Right moves forward in English, Left moves forward in Arabic.
      await page.keyboard.press(lang === 'ar' ? 'ArrowLeft' : 'ArrowRight');
      assert.match(await page.getAttribute('#gallery-main', 'src'), /the-only-one-3-960/);
      await page.click('.thumb >> nth=0');
      assert.equal(await page.getAttribute('.thumb >> nth=0', 'aria-current'), 'true');
      await page.click('.wish-btn');
      assert.equal(await page.getAttribute('.wish-btn', 'aria-pressed'), 'true');
      assert.deepEqual(await brokenImages(page), []);
      await page.evaluate(() => localStorage.removeItem('zaineldeen:wishlist:v1'));
    });
    await check(`[${lang}] gallery: switching language keeps the photo position and re-translates the credit`, async () => {
      await load(page, 'product.html?id=zip-lounge-set', FIXTURE_BASE);
      await page.click('.gallery__nav--next');
      await page.click(`.lang-switch--header [data-lang="${lang === 'en' ? 'ar' : 'en'}"]`);
      assert.match(await page.getAttribute('#gallery-main', 'src'), /zip-lounge-set-2-960/);
      assert.match(await page.textContent('#gallery-note'), lang === 'en' ? /الصورة/ : /Photo:/);
    });
    await check(`[${lang}] licensed photos appear on cards and collection tiles`, async () => {
      await load(page, 'index.html', FIXTURE_BASE);
      assert.ok(await page.locator('.collection--photo img[src*="collection-makeup-1"]').count());
      assert.ok(await page.locator('.hero__card--1:not(.hero__card--art) img[src*="the-only-one-1"]').count(), 'hero uses the registered photo');
      await load(page, 'shop.html?cat=pajamas', FIXTURE_BASE);
      assert.ok(await page.locator('.card[data-id="zip-lounge-set"] .card__media--bleed img[src*="zip-lounge-set-1"]').count());
      assert.deepEqual(await brokenImages(page), []);
    });
    await check(`[${lang}] axe: no violations on a product page with a licensed gallery`, async () => {
      await load(page, 'product.html?id=the-only-one', FIXTURE_BASE);
      await page.addScriptTag({ path: axePath });
      const found = await page.evaluate(async () => (await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] } })).violations.map((v) => `${v.id}: ${v.nodes[0].target.join(' ')}`));
      assert.deepEqual(found, []);
    });
    await page.context().close();
  }
} finally {
  if (fixtureServer) stopServer(fixtureServer);
  rmSync(fixtureDir, { recursive: true, force: true });
}

// ── Images: only cleared images are requested by the default build ───
{
  const page = await openPage('en');
  const imageRequests = new Set();
  page.on('request', (r) => r.resourceType() === 'image' && imageRequests.add(r.url()));
  await check('default build requests only owned photos and original illustrations', async () => {
    for (const u of ['index.html', 'shop.html', 'product.html?id=gucci-premiere', 'product.html?id=the-only-one', 'product.html?id=zip-lounge-set']) await load(page, u);
    assert.ok(imageRequests.size > 0);
    const files = [...imageRequests].filter((u) => !u.startsWith('data:'));
    const registered = Object.keys(JSON.parse(readFileSync(join(repoRoot, 'src/data/licensedImages.json'), 'utf8'))).join('|');
    const allowed = new RegExp(`(shopfront|logo-script|heritage-|favicon|og-image|apple-touch|\\.svg|/(${registered})-\\d-(480|960)-)`);
    assert.ok(files.every((u) => allowed.test(u)), `unexpected image: ${files.find((u) => !allowed.test(u))}`);
    assert.ok(files.some((u) => /shopfront/.test(u)), 'owned shopfront photo is used');
    await load(page, 'product.html?id=gucci-premiere');
    assert.equal(await page.locator('.thumb').count(), 0, 'a single illustration has no thumbnails');
    assert.match(await page.textContent('.gallery__note'), /Illustration/);
    assert.match(await page.getAttribute('#gallery-main', 'alt'), /^Illustration for/);
    await load(page, 'product.html?id=the-only-one');
    assert.match(await page.textContent('.gallery__note'), /original Zain El Deen Store website/);
    assert.deepEqual(await brokenImages(page), []);
  });
  await check('home uses the original shopfront photo and script logos', async () => {
    await load(page, 'index.html');
    assert.ok(await page.locator('.hero__card--2 img[src*="shopfront"]').count());
    assert.ok(await page.locator('#about-photo[src*="shopfront"]').count());
    assert.ok(await page.locator('#about-logo[src*="logo-script-pink"]').count());
    assert.ok(await page.locator('.footer__logo[src*="logo-script-black"]').count());
  });
  await page.context().close();
}

// ── Accessibility (axe-core) in both languages ────────────────────────
{
  for (const lang of ['en', 'ar']) {
    for (const [name, url] of [['home', 'index.html'], ['shop', 'shop.html?cat=perfumes'], ['product', 'product.html?id=the-only-one']]) {
      await check(`[${lang}] axe: no violations on ${name}`, async () => {
        const page = await openPage(lang);
        await load(page, url);
        // Audit the shop with the brand panel open and a brand selected.
        if (name === 'shop') {
          await page.click('#brand-toggle');
          await page.check('#brand-list input >> nth=0');
        }
        await page.addScriptTag({ path: axePath });
        const found = await page.evaluate(async () => {
          const res = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] } });
          return res.violations.map((v) => `${v.id} (${v.nodes.length}): ${v.nodes[0].target.join(' ')}`);
        });
        assert.deepEqual(found, []);
        await page.context().close();
      });
    }
  }
}

// ── Legacy Showcase (original 2020 edition) ──────────────────────────
const LEGACY = readdirSync(join(repoRoot, 'dist/legacy')).filter((f) => f.endsWith('.html'));
const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'];
const axeFound = (page) =>
  page.evaluate(async (tags) => (await axe.run(document, { runOnly: { type: 'tag', values: tags } })).violations.map((v) => `${v.id} (${v.nodes.length}): ${v.nodes[0].target.join(' ')}`), AXE_TAGS);
{
  await check('legacy: every page loads without errors, broken images, horizontal overflow or outside requests (320, 768, 1440 px)', async () => {
    const bad = [];
    for (const width of [320, 768, 1440]) {
      const page = await openPage(null, width);
      for (const f of LEGACY) {
        await load(page, `legacy/${f}`);
        if ((await brokenImages(page)).length) bad.push(`${f}@${width}: broken image`);
        if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) bad.push(`${f}@${width}: horizontal overflow`);
      }
      await page.context().close();
    }
    assert.deepEqual(bad, []);
  });

  await check('legacy: navigation, drop-down menus and the edition banner work', async () => {
    const page = await openPage(null, 1440);
    await load(page, 'legacy/index.html');
    assert.ok(await page.locator('.legacy-banner a[href="../index.html"]').count());
    assert.ok(await page.locator('.legacy-banner a[href="../then-and-now.html"]').count());
    await page.locator('.navbar a.dropdown-toggle', { hasText: 'Perfumes' }).click();
    await page.locator('.navbar .dropdown.open a[href="perfumes-women.html"]').click();
    await page.waitForURL(/perfumes-women\.html/);
    assert.match(await page.title(), /2020 archive/);
    await page.locator('.legacy-banner a[href="../then-and-now.html"]').click();
    await page.waitForURL(/then-and-now\.html/);
    await page.context().close();
  });

  await check('legacy: carousel advances and the phone navbar stays in flow', async () => {
    const page = await openPage(null, 390);
    await load(page, 'legacy/index.html');
    const before = await page.locator('.carousel-inner .item.active').count();
    assert.equal(before, 1);
    await page.locator('.carousel-control.right').click({ position: { x: 25, y: 60 } });
    await page.waitForTimeout(900);
    assert.equal(await page.locator('.carousel-inner .item.active').count(), 1);
    // the original navbar has no toggle: on phones it stacks in the page flow and every link stays reachable
    assert.ok(await page.locator('.navbar a[href="pajamas.html"]').isVisible());
    assert.ok((await page.locator('nav.navbar').boundingBox()).y < 5);
    await page.context().close();
  });

  await check('legacy: shows no personal data, stock or delivery claims', async () => {
    const page = await openPage(null, 1440);
    for (const f of LEGACY) {
      await load(page, `legacy/${f}`);
      const text = await page.evaluate(() => document.body.innerText);
      assert.ok(!/in stock|dispatched|cash on delivery|\d{3}[\s-]?\d{3}[\s-]?\d{4}|\w@\w/i.test(text), `${f}: ${text.match(/in stock|dispatched|cash on delivery|\d{3}[\s-]?\d{3}[\s-]?\d{4}|\w@\w/i)?.[0]}`);
    }
    await page.context().close();
  });

  await check('legacy: axe finds no violations on any page (desktop and mobile)', async () => {
    const found = [];
    for (const width of [1440, 390]) {
      const page = await openPage(null, width);
      for (const f of LEGACY) {
        await load(page, `legacy/${f}`);
        await page.addScriptTag({ path: axePath });
        for (const v of await axeFound(page)) found.push(`${f}@${width}: ${v}`);
      }
      await page.context().close();
    }
    assert.deepEqual(found, []);
  });
}

// ── Then & Now ────────────────────────────────────────────────────────
{
  for (const lang of ['en', 'ar']) {
    await check(`[${lang}] then & now: renders, compares, links to both editions`, async () => {
      const page = await openPage(lang, 1440);
      await load(page, 'then-and-now.html');
      assert.equal(await page.locator('html').getAttribute('dir'), lang === 'ar' ? 'rtl' : 'ltr');
      assert.equal(await page.locator('h1').count(), 1);
      assert.ok(await page.locator('main a[href="legacy/index.html"]').count());
      assert.ok(await page.locator('main a[href="index.html"]').count());
      assert.equal((await brokenImages(page)).length, 0);
      // credits use the neutral wording
      const credits = await page.locator('.tn-credits').innerText();
      assert.match(credits, lang === 'ar' ? /محمد زين الدين/ : /Mohammed Zaineldeen/);
      assert.ok(!/sole|only|solely/i.test(await page.locator('main').innerText()) || lang === 'ar');
      // tabs swap both screenshots and the page links
      await page.click('#tn-tabs [data-tab=catalog]');
      assert.match(await page.getAttribute('#tn-legacy', 'src'), /legacy-catalog/);
      assert.match(await page.getAttribute('#tn-modern', 'src'), /modern-catalog/);
      assert.match(await page.getAttribute('#tn-open-orig', 'href'), /perfumes-women/);
      assert.equal(await page.getAttribute('#tn-tabs [data-tab=catalog]', 'aria-pressed'), 'true');
      // the slider works by keyboard
      await page.focus('#tn-range');
      await page.keyboard.press('Home');
      assert.match(await page.getAttribute('#tn-top', 'style'), /inset\(0(px)? 100%/);
      await page.keyboard.press('End');
      assert.match(await page.getAttribute('#tn-top', 'style'), /inset\(0(px)? 0%/);
      await page.context().close();
    });
    await check(`[${lang}] then & now: no horizontal overflow (320-1920 px) and axe passes`, async () => {
      const page = await openPage(lang, 1440);
      for (const w of [320, 390, 768, 1024, 1920]) {
        await page.setViewportSize({ width: w, height: 900 });
        await load(page, 'then-and-now.html');
        assert.ok(!(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)), `overflow at ${w}`);
      }
      await page.addScriptTag({ path: axePath });
      assert.deepEqual(await axeFound(page), []);
      await page.context().close();
    });
  }
  await check('then & now: links from the modern home and header reach both editions', async () => {
    const page = await openPage('en', 1440);
    await load(page, 'index.html');
    await page.locator('header a[data-nav="then-and-now.html"]').first().click();
    await page.waitForURL(/then-and-now\.html/);
    await load(page, 'index.html');
    await page.locator('.heritage__links a[href="legacy/index.html"]').click();
    await page.waitForURL(/legacy\/index\.html/);
    await page.context().close();
  });
}

await check('no unexpected external requests (no CDNs, fonts, analytics or maps)', async () => assert.deepEqual([...external], [], [...external].join(' | ')));
await check('no console errors, warnings or failed requests during the whole run', async () => assert.deepEqual(problems, [], problems.join(' | ')));

await browser.close();
servers.forEach(stopServer);
for (const [s, n] of results) console.log(`${s}  ${n}`);
console.log(`\n${results.filter(([s]) => s === 'PASS').length} passed, ${results.filter(([s]) => s === 'FAIL').length} failed`);
process.exit(results.some(([s]) => s === 'FAIL') ? 1 : 0);
