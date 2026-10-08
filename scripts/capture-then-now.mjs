// Renders the before/after screenshots used by the Then & Now page from the real pages of the production build.
//   npm run build && npm run capture:then-now
// The pages contain only owned artwork and original illustrations, so the screenshots can be published.
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { chromium } from 'playwright';
import sharp from 'sharp';

const PORT = 4188;
const BASE = `http://localhost:${PORT}`;
const OUT = new URL('../assets/images/then-now/', import.meta.url).pathname;
const fallback = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const PAIRS = [
  { name: 'home', legacy: 'legacy/index.html', modern: 'index.html' },
  { name: 'catalog', legacy: 'legacy/perfumes-women.html', modern: 'shop.html?cat=perfumes' },
  { name: 'product', legacy: 'legacy/product-coco-mademoiselle.html', modern: 'product.html?id=coco-mademoiselle' },
];

const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore', detached: true });
const stop = () => { try { process.kill(-server.pid); } catch { /* already stopped */ } };
for (let i = 0; i < 60; i++) {
  try { if ((await fetch(BASE)).ok) break; } catch { await new Promise((r) => setTimeout(r, 200)); }
}

const browser = await chromium.launch(existsSync(fallback) ? { executablePath: fallback } : {});
try {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
  await ctx.addInitScript(() => localStorage.setItem('zaineldeen:lang', 'en'));
  for (const { name, legacy, modern } of PAIRS) {
    for (const [edition, url] of [['legacy', legacy], ['modern', modern]]) {
      const page = await ctx.newPage();
      await page.goto(`${BASE}/${url}`, { waitUntil: 'networkidle' });
      await page.addStyleTag({ content: 'html{scroll-behavior:auto!important}[data-reveal]{opacity:1!important;transform:none!important;transition:none!important}' });
      // Lazy images below the fold never load on their own, so request them all before waiting.
      await page.evaluate(() => document.querySelectorAll('img[loading=lazy]').forEach((i) => (i.loading = 'eager')));
      await page.evaluate(() => Promise.all([...document.images].map((i) => (i.complete ? 1 : new Promise((r) => (i.onload = i.onerror = r))))));
      await page.waitForTimeout(300);
      const png = await page.screenshot();
      await sharp(png).webp({ quality: 82 }).toFile(`${OUT}${edition}-${name}.webp`);
      await page.close();
    }
  }
  console.log('Captured', PAIRS.length * 2, 'screenshots into assets/images/then-now/');
} finally {
  await browser.close();
  stop();
}
